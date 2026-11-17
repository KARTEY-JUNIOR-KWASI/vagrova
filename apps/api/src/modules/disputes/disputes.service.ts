import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto, DisputeResolutionAction } from './dto/resolve-dispute.dto';
import { JobStatus, TruckStatus } from '@prisma/client';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Customer, Driver, or Agent raises an operational dispute or cargo incident.
   * Immediately sets Job status to DISPUTED and halts automated payouts.
   */
  async raiseDispute(userId: string, dto: RaiseDisputeDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        truck: { include: { owner: true } },
        driver: true,
        jobRequest: { include: { customer: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'AGENT', 'FINANCE'].includes(user.role);
    const isParticipant =
      job.jobRequest.customer.userId === userId ||
      job.driver?.userId === userId ||
      job.truck?.owner.userId === userId;

    if (!isStaff && !isParticipant) {
      throw new ForbiddenException('You are not authorized to raise a dispute on this job.');
    }

    const beforeState = { status: job.status };

    const updatedJob = await this.prisma.job.update({
      where: { id: dto.jobId },
      data: {
        status: JobStatus.DISPUTED,
      },
    });

    this.logger.warn(
      `[DISPUTE-RAISED] Job ${job.jobNumber} placed into DISPUTED status by User ${userId}. Reason: ${dto.reason}`
    );

    await this.auditService.log({
      actorId: userId,
      action: 'JOB_DISPUTE_RAISED',
      entityName: 'Job',
      entityId: job.id,
      beforeState,
      afterState: {
        status: JobStatus.DISPUTED,
        reason: dto.reason,
        description: dto.description,
        evidencePhotos: dto.evidencePhotoKeys || [],
      },
    });

    return {
      success: true,
      message: 'Dispute recorded. Operations team and dispatch have been alerted.',
      jobNumber: job.jobNumber,
      status: updatedJob.status,
    };
  }

  /**
   * Admin / Management investigates evidence and resolves the dispute.
   * Releases provider payout, applies penalty deduction, or initiates customer refund.
   */
  async resolveDispute(adminId: string, jobId: string, dto: ResolveDisputeDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        quote: true,
        truck: true,
        payouts: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.DISPUTED) {
      throw new BadRequestException('Job is not in DISPUTED status');
    }

    const beforeState = { status: job.status };

    await this.prisma.$transaction(async (tx) => {
      // 1. Release truck if still linked
      if (job.truckId) {
        await tx.truck.update({
          where: { id: job.truckId },
          data: { status: TruckStatus.AVAILABLE },
        });
      }

      // 2. Mark job COMPLETED or CANCELLED based on resolution
      const targetJobStatus =
        dto.action === DisputeResolutionAction.FULL_REFUND_CUSTOMER
          ? JobStatus.CANCELLED
          : JobStatus.COMPLETED;

      await tx.job.update({
        where: { id: jobId },
        data: {
          status: targetJobStatus,
          completedAt: new Date(),
        },
      });
    });

    this.logger.log(
      `[DISPUTE-RESOLVED] Job ${job.jobNumber} resolved with action ${dto.action} by Admin ${adminId}`
    );

    await this.auditService.log({
      actorId: adminId,
      action: `DISPUTE_RESOLVED_${dto.action}`,
      entityName: 'Job',
      entityId: jobId,
      beforeState,
      afterState: {
        resolutionAction: dto.action,
        notes: dto.resolutionNotes,
        adjustedPayout: dto.adjustedPayoutMinorUnits,
      },
    });

    return {
      success: true,
      jobNumber: job.jobNumber,
      resolution: dto.action,
    };
  }

  /**
   * Returns list of currently disputed jobs for the operations dashboard.
   */
  async listDisputedJobs() {
    return this.prisma.job.findMany({
      where: { status: JobStatus.DISPUTED },
      include: {
        jobRequest: {
          include: { customer: { include: { user: true } } },
        },
        driver: { include: { user: true } },
        truck: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

