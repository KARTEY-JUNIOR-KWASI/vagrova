import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { JobStatus, LedgerEntryType, PaymentMethod, PaymentStatus } from '@prisma/client';
import { FinanceService } from './finance.service';

describe('FinanceService — Commission, Payouts & Double-Entry Balance', () => {
  it('blocks payout settlement on DISPUTED jobs', async () => {
    const mockPrisma: any = {
      job: {
        findUnique: async () => ({
          id: 'job-1',
          jobNumber: 'VGJ-004817',
          status: JobStatus.DISPUTED,
          driverId: 'prov-1',
          quote: { totalMinorUnits: 685000n, currency: 'GHS' },
          payouts: [],
        }),
      },
    };

    const service = new FinanceService(mockPrisma, { log: async () => {} } as any);

    await assert.rejects(
      () => service.settlePayout('admin-1', 'job-1', { payoutMethod: PaymentMethod.MOBILE_MONEY }),
      BadRequestException,
    );
  });

  it('prevents duplicate confirmed payouts for the same job', async () => {
    const mockPrisma: any = {
      job: {
        findUnique: async () => ({
          id: 'job-1',
          jobNumber: 'VGJ-004818',
          status: JobStatus.COMPLETED,
          driverId: 'prov-1',
          quote: { totalMinorUnits: 685000n, currency: 'GHS' },
          payouts: [{ id: 'payout-existing', status: PaymentStatus.CONFIRMED }],
        }),
      },
    };

    const service = new FinanceService(mockPrisma, { log: async () => {} } as any);

    await assert.rejects(
      () => service.settlePayout('admin-1', 'job-1', { payoutMethod: PaymentMethod.MOBILE_MONEY }),
      ConflictException,
    );
  });

  it('posts balanced double-entry ledger entries in exact integer pesewas', async () => {
    const ledgerEntries: any[] = [];
    const mockPrisma: any = {
      job: {
        findUnique: async () => ({
          id: 'job-1',
          jobNumber: 'VGJ-004829',
          status: JobStatus.COMPLETED,
          driverId: 'prov-1',
          quote: { totalMinorUnits: 685000n, currency: 'GHS' }, // GHS 6,850.00
          driver: { user: { name: 'Yaw Boateng' } },
          truck: { plate: 'GW-2290-22' },
          payouts: [],
        }),
      },
      $transaction: async (cb: any) => {
        const tx = {
          payout: {
            create: async ({ data }: any) => ({ id: 'payout-1', ...data }),
          },
          ledgerEntry: {
            create: async ({ data }: any) => {
              ledgerEntries.push(data);
            },
          },
        };
        return cb(tx);
      },
    };

    const service = new FinanceService(mockPrisma, { log: async () => {} } as any);
    const result = await service.settlePayout('admin-1', 'job-1', {
      payoutMethod: PaymentMethod.MOBILE_MONEY,
    });

    assert.equal(result.commissionEarnedGHS, '1027.50'); // 15% of 6850.00
    assert.equal(result.netDisbursedGHS, '5822.50');     // 85% of 6850.00

    const totalDebit = ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.DEBIT)
      .reduce((acc, e) => acc + e.amountMinorUnits, 0n);
    const totalCredit = ledgerEntries
      .filter((e) => e.entryType === LedgerEntryType.CREDIT)
      .reduce((acc, e) => acc + e.amountMinorUnits, 0n);

    assert.equal(totalDebit, 685000n);
    assert.equal(totalCredit, 685000n);
    assert.equal(totalDebit, totalCredit);
  });
});
