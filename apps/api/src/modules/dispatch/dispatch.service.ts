import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { TrackingGateway } from '@/modules/tracking/tracking.gateway';
import { BroadcastOffersDto } from './dto/broadcast-offers.dto';
import { RespondOfferDto, OfferResponseAction } from './dto/respond-offer.dto';
import { AdvanceTripStepDto } from './dto/advance-trip-step.dto';
import {
  TruckStatus,
  OfferStatus,
  JobStatus,
  PaymentStatus,
  BookingStatus,
  ServiceCategoryGroup,
  UserRole,
  RentalStatus,
} from '@prisma/client';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Optional() private readonly trackingGateway?: TrackingGateway,
  ) {}

  /**
   * Lists jobs for the Admin / Dispatcher operations console.
   */
  async listAdminJobs() {
    return this.prisma.job.findMany({
      include: {
        jobRequest: {
          include: {
            customer: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        quote: true,
        truck: true,
        driver: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Identifies candidate trucks matching load type, tonnage, and active compliance.
   * Excludes trucks with expired documents or offline status.
   */
  async findMatchingTrucks(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { jobRequest: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const { vehicleType, weightTonnes } = job.jobRequest;

    // Filter available trucks with valid documents and adequate capacity
    const availableTrucks = await this.prisma.truck.findMany({
      where: {
        status: TruckStatus.AVAILABLE,
        type: vehicleType,
        capacityTonnes: { gte: weightTonnes },
        deletedAt: null,
      },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
        assignments: {
          where: { isActive: true },
          include: { driver: { include: { user: true } } },
        },
      },
    });

    return availableTrucks.map((t) => {
      const activeDriver = t.assignments[0]?.driver || t.owner;
      return {
        truckId: t.id,
        plate: t.plate,
        type: t.type,
        makeModel: `${t.make} ${t.model} (${t.year})`,
        capacityTonnes: Number(t.capacityTonnes),
        driverName: activeDriver.user.name,
        driverPhone: activeDriver.user.phone,
        driverRating: Number(activeDriver.rating),
        totalTrips: activeDriver.totalTrips,
        lastKnownLocation: {
          latitude: t.latitude ? Number(t.latitude) : null,
          longitude: t.longitude ? Number(t.longitude) : null,
          updatedAt: t.lastLocationAt,
        },
      };
    });
  }

  /**
   * Broadcasts job offers to shortlisted trucks with a countdown window (e.g. 60 seconds).
   */
  async broadcastOffers(agentId: string, dto: BroadcastOffersDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { jobRequest: true, quote: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.driverId) {
      throw new BadRequestException('Job is already assigned to a driver.');
    }

    const countdownSeconds = dto.countdownSeconds || 60;
    const expiresAt = new Date(Date.now() + countdownSeconds * 1000);

    // Create atomic offer records
    const createdOffers = await this.prisma.$transaction(
      dto.truckIds.map((truckId) =>
        this.prisma.offer.create({
          data: {
            jobId: job.id,
            truckId,
            expiresAt,
            status: OfferStatus.PENDING,
          },
        })
      )
    );

    await this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.OFFERED },
    });

    this.logger.log(
      `[DISPATCH-BROADCAST] Sent ${createdOffers.length} offers for Job ${job.jobNumber} with ${countdownSeconds}s countdown.`
    );

    if (this.trackingGateway) {
      const trucks = await this.prisma.truck.findMany({
        where: { id: { in: dto.truckIds } },
        include: { owner: true },
      });
      for (const offer of createdOffers) {
        const truck = trucks.find((t) => t.id === offer.truckId);
        if (truck?.owner?.userId) {
          this.trackingGateway.emitJobOfferToUser(truck.owner.userId, {
            offerId: offer.id,
            jobId: job.id,
            jobNumber: job.jobNumber,
            pickupAddress: job.jobRequest.pickupAddress,
            deliveryAddress: job.jobRequest.deliveryAddress,
            cargo: job.jobRequest.notes || job.jobRequest.vehicleType,
            vehicleType: job.jobRequest.vehicleType,
            weightTonnes: job.jobRequest.weightTonnes,
            countdownSeconds,
            expiresAt,
          });
        }
      }
    }

    await this.auditService.log({
      actorId: agentId,
      action: 'JOB_OFFERS_BROADCASTED',
      entityName: 'Job',
      entityId: job.id,
      afterState: {
        truckCount: dto.truckIds.length,
        expiresAt,
      },
    });

    return {
      success: true,
      jobId: job.id,
      jobNumber: job.jobNumber,
      offersCount: createdOffers.length,
      expiresAt,
    };
  }

  /**
   * Driver response: Accept or Decline offer.
   * Atomically enforces:
   * 1. First valid acceptance wins.
   * 2. Concurrent acceptances are prevented via row-level atomic transaction.
   * 3. Subsequent responders receive 'Job already taken'.
   */
  async respondToOffer(driverUserId: string, offerId: string, dto: RespondOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        job: { include: { jobRequest: true } },
        truck: {
          include: {
            owner: true,
            assignments: { where: { isActive: true } },
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { userId: driverUserId },
    });

    if (!provider) {
      throw new ForbiddenException('User is not an active provider');
    }

    const isTruckOwner = offer.truck.ownerId === provider.id;
    const isAssignedDriver = offer.truck.assignments.some((a) => a.driverId === provider.id);
    if (!isTruckOwner && !isAssignedDriver) {
      throw new ForbiddenException('You are not authorized to respond to offers for this truck.');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Offer is no longer pending (current status: ${offer.status}).`);
    }

    if (
      dto.action === OfferResponseAction.ACCEPT &&
      provider.verificationStatus !== 'APPROVED'
    ) {
      throw new ForbiddenException(
        `Your driver/owner account is ${provider.verificationStatus}. Complete all verification requirements and receive Admin approval before accepting orders.`,
      );
    }

    // ─── 1. DECLINE ACTION ───────────────────────────────────────────────────
    if (dto.action === OfferResponseAction.DECLINE) {
      await this.prisma.offer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.DECLINED,
          declineReason: dto.declineReason || 'Declined by driver',
        },
      });

      await this.auditService.log({
        actorId: driverUserId,
        action: 'JOB_OFFER_DECLINED',
        entityName: 'Offer',
        entityId: offerId,
        afterState: { reason: dto.declineReason },
      });

      return { success: true, message: 'Offer declined' };
    }

    // ─── 2. ACCEPT ACTION (ATOMIC RACE-CONDITION RESOLUTION) ─────────────────
    if (new Date() > offer.expiresAt) {
      throw new BadRequestException('This offer has expired. The countdown time elapsed.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Atomic conditional claim: PostgreSQL row lock ensures only ONE concurrent transaction can get count === 1
      const claim = await tx.job.updateMany({
        where: {
          id: offer.jobId,
          driverId: null,
          status: { in: [JobStatus.BOOKED, JobStatus.OFFERED] },
        },
        data: {
          driverId: provider.id,
          truckId: offer.truckId,
          status: JobStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      if (claim.count !== 1) {
        await tx.offer.update({
          where: { id: offerId },
          data: { status: OfferStatus.EXPIRED },
        });

        throw new ConflictException(
          'This haulage job was already accepted by another carrier or is no longer open.'
        );
      }

      const updatedJob = await tx.job.findUniqueOrThrow({
        where: { id: offer.jobId },
      });

      // 2. Mark winning offer ACCEPTED
      await tx.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.ACCEPTED },
      });

      // 3. Expire all rival offers for this job
      await tx.offer.updateMany({
        where: {
          jobId: updatedJob.id,
          id: { not: offerId },
        },
        data: { status: OfferStatus.EXPIRED },
      });

      // 4. Set truck to BUSY
      await tx.truck.update({
        where: { id: offer.truckId },
        data: { status: TruckStatus.BUSY },
      });

      return updatedJob;
    });

    this.logger.log(
      `[OFFER-ACCEPTED] Job ${result.jobNumber} won by Driver ${provider.id} with Truck ${offer.truck.plate}`
    );

    await this.auditService.log({
      actorId: driverUserId,
      action: 'JOB_OFFER_ACCEPTED_ATOMIC_WIN',
      entityName: 'Job',
      entityId: result.id,
      afterState: {
        jobNumber: result.jobNumber,
        assignedDriverId: provider.id,
        truckPlate: offer.truck.plate,
      },
    });

    return {
      success: true,
      message: 'Job confirmed! You are now assigned to this haulage trip.',
      jobId: result.id,
      jobNumber: result.jobNumber,
      status: result.status,
    };
  }

  /**
   * Driver field update: Advances the single step button.
   * Enforces sequence:
   *   ASSIGNED -> HEADING_TO_PICKUP -> LOADED (photo required)
   *   -> IN_TRANSIT -> DELIVERED (photo + customer code required) -> COMPLETED
   */
  async advanceTripStep(driverUserId: string, jobId: string, dto: AdvanceTripStepDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: driverUserId },
    });

    if (!provider) {
      throw new ForbiddenException('Provider profile not found');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { truck: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.driverId !== provider.id) {
      throw new ForbiddenException('You are not the confirmed driver for this trip.');
    }

    // Strict State Machine Transition Table
    const ALLOWED_TRANSITIONS: Partial<Record<JobStatus, JobStatus[]>> = {
      [JobStatus.ASSIGNED]: [JobStatus.HEADING_TO_PICKUP],
      [JobStatus.HEADING_TO_PICKUP]: [JobStatus.LOADED],
      [JobStatus.LOADED]: [JobStatus.IN_TRANSIT],
      [JobStatus.IN_TRANSIT]: [JobStatus.DELIVERED],
      [JobStatus.DELIVERED]: [JobStatus.COMPLETED],
    };

    const allowedNext = ALLOWED_TRANSITIONS[job.status] || [];
    if (!allowedNext.includes(dto.nextStatus)) {
      throw new BadRequestException(
        `Invalid state transition: cannot move job from "${job.status}" to "${dto.nextStatus}".`
      );
    }

    const beforeState = { status: job.status };
    const updateData: any = { status: dto.nextStatus };

    // Strict State Machine Verification
    switch (dto.nextStatus) {
      case JobStatus.HEADING_TO_PICKUP:
        updateData.headingToPickupAt = new Date();
        break;

      case JobStatus.LOADED:
        if (!dto.photoProofKey) {
          throw new BadRequestException('Loading proof photo is mandatory before departing pickup site.');
        }
        updateData.loadedAt = new Date();
        updateData.loadingProofPhotoKey = dto.photoProofKey;
        break;

      case JobStatus.IN_TRANSIT:
        updateData.inTransitAt = new Date();
        break;

      case JobStatus.DELIVERED:
        if (!dto.photoProofKey) {
          throw new BadRequestException('Delivery proof photo is mandatory before marking job delivered.');
        }
        if (!dto.deliveryCode) {
          throw new BadRequestException('Customer delivery confirmation code is required.');
        }
        if (dto.deliveryCode !== job.deliveryCode) {
          throw new BadRequestException('Invalid confirmation code. Please obtain the code from the site receiver.');
        }
        updateData.deliveredAt = new Date();
        updateData.deliveryProofPhotoKey = dto.photoProofKey;
        break;

      case JobStatus.COMPLETED:
        updateData.completedAt = new Date();
        // Return truck back to AVAILABLE
        if (job.truckId) {
          await this.prisma.truck.update({
            where: { id: job.truckId },
            data: { status: TruckStatus.AVAILABLE },
          });
        }
        break;

      default:
        throw new BadRequestException(`Unsupported transition status: ${dto.nextStatus}`);
    }

    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    this.logger.log(
      `[TRIP-PROGRESS] Job ${job.jobNumber} advanced to ${dto.nextStatus} by Driver ${provider.id}`
    );

    if (this.trackingGateway) {
      this.trackingGateway.emitJobStatusUpdate(jobId, {
        jobId,
        jobNumber: updatedJob.jobNumber,
        status: updatedJob.status,
        latitude: dto.latitude,
        longitude: dto.longitude,
        updatedAt: new Date(),
      });
    }

    await this.auditService.log({
      actorId: driverUserId,
      action: `TRIP_STEP_ADVANCED_${dto.nextStatus}`,
      entityName: 'Job',
      entityId: jobId,
      beforeState,
      afterState: {
        status: updatedJob.status,
        gps: dto.latitude && dto.longitude ? `${dto.latitude},${dto.longitude}` : undefined,
      },
    });

    return {
      success: true,
      jobNumber: updatedJob.jobNumber,
      status: updatedJob.status,
    };
  }

  /**
   * Lists jobs belonging to the authenticated customer or driver.
   */
  async listMyJobs(userId: string) {
    return this.prisma.job.findMany({
      where: {
        deletedAt: null,
        OR: [
          { jobRequest: { customer: { userId } } },
          { driver: { userId } },
          { truck: { owner: { userId } } },
        ],
      },
      include: {
        jobRequest: true,
        quote: true,
        truck: true,
        driver: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Cancels a job prior to loading/transit, releases any assigned truck, and records audit trail.
   */
  async cancelJob(userId: string, userRole: string, jobId: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('Cancellation reason is required.');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobRequest: { include: { customer: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const isStaff = ['ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'AGENT'].includes(userRole);
    const isCustomerOwner = job.jobRequest.customer.userId === userId;

    if (!isStaff && !isCustomerOwner) {
      throw new ForbiddenException('You are not authorized to cancel this job.');
    }

    const NON_CANCELLABLE: JobStatus[] = [
      JobStatus.LOADED,
      JobStatus.IN_TRANSIT,
      JobStatus.DELIVERED,
      JobStatus.COMPLETED,
      JobStatus.CANCELLED,
    ];
    if (NON_CANCELLABLE.includes(job.status)) {
      throw new BadRequestException(
        `Job cannot be cancelled once it is in "${job.status}" status. Raise a dispute instead.`,
      );
    }

    const beforeState = { status: job.status, truckId: job.truckId, driverId: job.driverId };

    const cancelledJob = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: userId,
          cancellationReason: reason.trim(),
        },
      });

      await tx.offer.updateMany({
        where: { jobId, status: OfferStatus.PENDING },
        data: { status: OfferStatus.EXPIRED },
      });

      if (job.truckId) {
        await tx.truck.update({
          where: { id: job.truckId },
          data: { status: TruckStatus.AVAILABLE },
        });
      }

      return updated;
    });

    await this.auditService.log({
      actorId: userId,
      action: 'JOB_CANCELLED',
      entityName: 'Job',
      entityId: jobId,
      beforeState,
      afterState: { status: JobStatus.CANCELLED, reason: reason.trim() },
    });

    return {
      success: true,
      jobNumber: cancelledJob.jobNumber,
      status: cancelledJob.status,
    };
  }

  /**
   * Company-controlled Dispatch: Assigns an available truck/machine + driver/operator
   * after checking payment condition and preventing double-booking conflicts.
   */
  async assignEquipmentAndOperator(
    staffId: string,
    staffRole: UserRole,
    jobId: string,
    dto: {
      truckId: string;
      driverId: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      operationalNotes?: string;
      allowUnpaidException?: boolean;
    },
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobRequest: { include: { equipmentType: true, projectDetail: true } },
        payments: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const hasConfirmedPayment = job.payments.some((p) => p.status === PaymentStatus.CONFIRMED);
    const canBypassPayment = (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.OPERATIONS_MANAGER] as UserRole[]
    ).includes(staffRole);

    if (!hasConfirmedPayment && !(dto.allowUnpaidException && canBypassPayment)) {
      throw new BadRequestException(
        'Payment confirmation is required before dispatch (unless Finance/Operations approves an exception).',
      );
    }

    const truck = await this.prisma.truck.findUnique({ where: { id: dto.truckId } });
    if (!truck) throw new NotFoundException('Equipment/Truck not found');
    if (truck.status !== TruckStatus.AVAILABLE) {
      throw new ConflictException(`Equipment ${truck.plate} is currently ${truck.status} and unavailable.`);
    }

    const driver = await this.prisma.provider.findUnique({
      where: { id: dto.driverId },
      include: { user: true },
    });
    if (!driver) throw new NotFoundException('Driver/Operator not found');

    const conflict = await this.prisma.assignment.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [{ truckId: dto.truckId }, { driverId: dto.driverId }],
      },
    });
    if (conflict) {
      throw new ConflictException(
        'Selected equipment or operator already has an active conflicting assignment.',
      );
    }

    const scheduledStart = dto.scheduledStart ? new Date(dto.scheduledStart) : new Date();
    const scheduledEnd = dto.scheduledEnd ? new Date(dto.scheduledEnd) : null;

    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          jobId,
          truckId: dto.truckId,
          driverId: dto.driverId,
          assignedById: staffId,
          scheduledStart,
          scheduledEnd,
          operationalNotes: dto.operationalNotes || null,
          status: 'ACTIVE',
        },
      });

      await tx.job.update({
        where: { id: jobId },
        data: {
          truckId: dto.truckId,
          driverId: dto.driverId,
          status: JobStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      await tx.truck.update({
        where: { id: dto.truckId },
        data: { status: TruckStatus.BUSY },
      });

      await tx.jobRequest.update({
        where: { id: job.jobRequestId },
        data: { bookingStatus: BookingStatus.DISPATCHED },
      });

      if (job.jobRequest.serviceGroup === ServiceCategoryGroup.MACHINERY) {
        await tx.rentalRecord.upsert({
          where: { jobId },
          update: {},
          create: { jobId },
        });
      }

      return created;
    });

    // Notify Driver/Operator with operational brief ONLY (zero customer pricing/negotiation info)
    if (this.trackingGateway && driver.userId) {
      this.trackingGateway.emitJobOfferToUser(driver.userId, {
        assignmentId: assignment.id,
        jobId: job.id,
        jobNumber: job.jobNumber,
        serviceGroup: job.jobRequest.serviceGroup,
        equipment: `${truck.make} ${truck.model} (${truck.plate})`,
        pickupAddress: job.jobRequest.projectDetail?.projectLocation || job.jobRequest.pickupAddress,
        deliveryAddress:
          job.jobRequest.serviceGroup === ServiceCategoryGroup.MACHINERY
            ? null
            : job.jobRequest.deliveryAddress,
        scheduledStart,
        operationalNotes: dto.operationalNotes || job.jobRequest.description,
      });
    }

    await this.auditService.log({
      actorId: staffId,
      action: 'COMPANY_DISPATCH_ASSIGNED',
      entityName: 'Assignment',
      entityId: assignment.id,
      afterState: {
        jobId,
        truckId: dto.truckId,
        driverId: dto.driverId,
        unpaidException: Boolean(dto.allowUnpaidException),
      },
    });

    return assignment;
  }

  /**
   * Returns assignments belonging ONLY to the authenticated driver/operator,
   * stripping all customer financial/negotiation details.
   */
  async getDriverAssignments(driverUserId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId: driverUserId } });
    if (!provider) return [];

    const rows = await this.prisma.assignment.findMany({
      where: { driverId: provider.id },
      include: {
        truck: true,
        job: {
          include: {
            rentalRecord: true,
            jobRequest: {
              select: {
                jobNumber: true,
                serviceGroup: true,
                pickupAddress: true,
                deliveryAddress: true,
                description: true,
                needLoadingHelp: true,
                needOffloadingHelp: true,
                projectDetail: true,
                equipmentType: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows;
  }

  /**
   * Milestone 8: Updates Machinery Rental operational lifecycle
   * (SCHEDULED -> MOBILIZING -> ON_SITE -> WORKING -> COMPLETED -> RETURNED)
   */
  async updateRentalProgress(
    actorId: string,
    jobId: string,
    dto: {
      status: RentalStatus;
      loggedHours?: number;
      operatorNotes?: string;
    },
  ) {
    const rental = await this.prisma.rentalRecord.findUnique({
      where: { jobId },
      include: { job: true },
    });
    if (!rental) throw new NotFoundException('Rental record not found for this job');

    const now = new Date();
    const updated = await this.prisma.rentalRecord.update({
      where: { jobId },
      data: {
        status: dto.status,
        ...(dto.status === RentalStatus.MOBILIZING ? { mobilizedAt: now } : {}),
        ...(dto.status === RentalStatus.ON_SITE ? { arrivedSiteAt: now } : {}),
        ...(dto.status === RentalStatus.WORKING ? { workStartedAt: now } : {}),
        ...(dto.status === RentalStatus.COMPLETED ? { completedAt: now } : {}),
        ...(dto.status === RentalStatus.RETURNED ? { returnedAt: now } : {}),
        ...(dto.loggedHours !== undefined ? { loggedHours: dto.loggedHours } : {}),
        ...(dto.operatorNotes !== undefined ? { operatorNotes: dto.operatorNotes } : {}),
      },
    });

    if (this.trackingGateway) {
      this.trackingGateway.emitJobStatusUpdate(jobId, {
        jobId,
        jobNumber: rental.job.jobNumber,
        status: `RENTAL_${dto.status}`,
        updatedAt: now,
      });
    }

    await this.auditService.log({
      actorId,
      action: `RENTAL_PROGRESS_${dto.status}`,
      entityName: 'RentalRecord',
      entityId: updated.id,
      afterState: { status: dto.status, loggedHours: dto.loggedHours },
    });

    return updated;
  }
}

