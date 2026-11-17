import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JobStatus } from '@prisma/client';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Submits a 1-5 star review and recalculates cumulative provider rating.
   */
  async submitRating(fromUserId: string, dto: SubmitRatingDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        driver: { include: { user: true } },
        jobRequest: { include: { customer: { include: { user: true } } } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.DELIVERED && job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Ratings can only be submitted after cargo has been delivered.');
    }

    const customerUserId = job.jobRequest.customer.userId;
    const driverUserId = job.driver?.userId;

    if (fromUserId !== customerUserId && fromUserId !== driverUserId) {
      throw new ForbiddenException('Only job participants may submit a rating.');
    }

    const expectedCounterparty = fromUserId === customerUserId ? driverUserId : customerUserId;
    if (!expectedCounterparty || dto.toUserId !== expectedCounterparty) {
      throw new BadRequestException('Target rated user must be the counterparty on this job.');
    }

    // Check duplicate
    const existing = await this.prisma.rating.findFirst({
      where: {
        jobId: dto.jobId,
        fromUserId,
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a rating for this haulage trip.');
    }

    // Create rating
    const rating = await this.prisma.rating.create({
      data: {
        jobId: dto.jobId,
        fromUserId,
        toUserId: dto.toUserId,
        score: dto.score,
        comment: dto.comment,
      },
    });

    // If rated user is a provider/driver, recompute their average rating
    const provider = await this.prisma.provider.findUnique({
      where: { userId: dto.toUserId },
    });

    if (provider) {
      const allRatings = await this.prisma.rating.findMany({
        where: { toUserId: dto.toUserId },
      });

      const avg =
        allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

      await this.prisma.provider.update({
        where: { id: provider.id },
        data: {
          rating: Number(avg.toFixed(2)),
          totalTrips: { increment: 1 },
        },
      });

      this.logger.log(`[RATING] Provider ${provider.id} rating updated to ${avg.toFixed(2)}`);
    }

    await this.auditService.log({
      actorId: fromUserId,
      action: 'RATING_SUBMITTED',
      entityName: 'Rating',
      entityId: rating.id,
      afterState: { score: dto.score, toUser: dto.toUserId },
    });

    return {
      success: true,
      score: dto.score,
      comment: dto.comment,
    };
  }
}

