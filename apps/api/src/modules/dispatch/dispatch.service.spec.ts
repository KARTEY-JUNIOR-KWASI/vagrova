import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { JobStatus, OfferStatus, TruckStatus } from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { OfferResponseAction } from './dto/respond-offer.dto';

describe('DispatchService — Atomic Acceptance & State Machine', () => {
  it('resolves concurrent offer acceptance atomically (only first claim wins)', async () => {
    let jobClaimed = false;
    const expiredOffers: string[] = [];

    const mockPrisma: any = {
      offer: {
        findUnique: async ({ where }: any) => ({
          id: where.id,
          jobId: 'job-1',
          truckId: where.id === 'offer-1' ? 'truck-1' : 'truck-2',
          status: OfferStatus.PENDING,
          expiresAt: new Date(Date.now() + 60_000),
          job: { jobRequest: {} },
          truck: {
            ownerId: where.id === 'offer-1' ? 'prov-1' : 'prov-2',
            plate: where.id === 'offer-1' ? 'GW-1111-22' : 'GW-2222-22',
            assignments: [],
          },
        }),
      },
      provider: {
        findUnique: async ({ where }: any) => ({
          id: where.userId === 'user-1' ? 'prov-1' : 'prov-2',
          userId: where.userId,
        }),
      },
      $transaction: async (cb: any) => {
        const tx = {
          job: {
            updateMany: async () => {
              if (!jobClaimed) {
                jobClaimed = true;
                return { count: 1 };
              }
              return { count: 0 };
            },
            findUniqueOrThrow: async () => ({
              id: 'job-1',
              jobNumber: 'VGJ-004829',
              status: JobStatus.ASSIGNED,
            }),
          },
          offer: {
            update: async ({ where, data }: any) => {
              if (data.status === OfferStatus.EXPIRED) {
                expiredOffers.push(where.id);
              }
            },
            updateMany: async () => ({ count: 1 }),
          },
          truck: {
            update: async () => ({}),
          },
        };
        return cb(tx);
      },
    };

    const service = new DispatchService(mockPrisma, { log: async () => {} } as any);

    const win = await service.respondToOffer('user-1', 'offer-1', {
      action: OfferResponseAction.ACCEPT,
    });
    assert.equal(win.status, JobStatus.ASSIGNED);

    await assert.rejects(
      () =>
        service.respondToOffer('user-2', 'offer-2', {
          action: OfferResponseAction.ACCEPT,
        }),
      ConflictException,
    );
    assert.deepEqual(expiredOffers, ['offer-2']);
  });

  it('rejects out-of-order state transitions and missing delivery code/photos', async () => {
    const makeService = (currentStatus: JobStatus) => {
      const mockPrisma: any = {
        provider: { findUnique: async () => ({ id: 'prov-1', userId: 'user-1' }) },
        job: {
          findUnique: async () => ({
            id: 'job-1',
            jobNumber: 'VGJ-004829',
            driverId: 'prov-1',
            truckId: 'truck-1',
            status: currentStatus,
            deliveryCode: '7428',
          }),
        },
      };
      return new DispatchService(mockPrisma, { log: async () => {} } as any);
    };

    // Cannot jump directly from ASSIGNED to COMPLETED
    await assert.rejects(
      () => makeService(JobStatus.ASSIGNED).advanceTripStep('user-1', 'job-1', { nextStatus: JobStatus.COMPLETED }),
      BadRequestException,
    );

    // Cannot advance a DISPUTED job
    await assert.rejects(
      () => makeService(JobStatus.DISPUTED).advanceTripStep('user-1', 'job-1', { nextStatus: JobStatus.COMPLETED }),
      BadRequestException,
    );

    // Cannot mark LOADED without photoProofKey
    await assert.rejects(
      () => makeService(JobStatus.HEADING_TO_PICKUP).advanceTripStep('user-1', 'job-1', { nextStatus: JobStatus.LOADED }),
      BadRequestException,
    );

    // Cannot mark DELIVERED with wrong 4-digit customer code
    await assert.rejects(
      () =>
        makeService(JobStatus.IN_TRANSIT).advanceTripStep('user-1', 'job-1', {
          nextStatus: JobStatus.DELIVERED,
          photoProofKey: 'proofs/del.jpg',
          deliveryCode: '0000',
        }),
      BadRequestException,
    );
  });

  it('blocks cancellation once job is IN_TRANSIT', async () => {
    const mockPrisma: any = {
      job: {
        findUnique: async () => ({
          id: 'job-1',
          status: JobStatus.IN_TRANSIT,
          jobRequest: { customer: { userId: 'cust-user-1' } },
        }),
      },
    };
    const service = new DispatchService(mockPrisma, { log: async () => {} } as any);

    await assert.rejects(
      () => service.cancelJob('cust-user-1', 'CUSTOMER', 'job-1', 'Changed mind'),
      BadRequestException,
    );
  });

  it('blocks company dispatch when payment is unconfirmed (without exception)', async () => {
    const mockPrisma: any = {
      job: {
        findUnique: async () => ({
          id: 'job-1',
          payments: [{ status: 'PROCESSING' }],
          jobRequest: { equipmentType: null, projectDetail: null },
        }),
      },
    };
    const service = new DispatchService(mockPrisma, { log: async () => {} } as any);

    await assert.rejects(
      () =>
        service.assignEquipmentAndOperator('staff-1', 'DISPATCHER' as any, 'job-1', {
          truckId: 'truck-1',
          driverId: 'prov-1',
        }),
      BadRequestException,
    );
  });

  it('blocks conflicting active assignments on the same truck or operator', async () => {
    const mockPrisma: any = {
      job: {
        findUnique: async () => ({
          id: 'job-2',
          payments: [{ status: 'CONFIRMED' }],
          jobRequest: { equipmentType: null, projectDetail: null },
        }),
      },
      truck: {
        findUnique: async () => ({ id: 'truck-1', plate: 'GW-2290-22', status: 'AVAILABLE' }),
      },
      provider: {
        findUnique: async () => ({ id: 'prov-1', userId: 'drv-1' }),
      },
      assignment: {
        findFirst: async () => ({ id: 'assign-existing', status: 'ACTIVE' }),
      },
    };
    const service = new DispatchService(mockPrisma, { log: async () => {} } as any);

    await assert.rejects(
      () =>
        service.assignEquipmentAndOperator('staff-1', 'DISPATCHER' as any, 'job-2', {
          truckId: 'truck-1',
          driverId: 'prov-1',
        }),
      ConflictException,
    );
  });
});
