import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { PricingService } from '@/modules/pricing/pricing.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { RespondQuoteDto, QuoteResponseAction } from './dto/respond-quote.dto';
import { ServiceCategoryGroup, BookingStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly pricingService: PricingService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Generates next sequential human-readable job number (e.g. VGJ-004829)
   */
  private async generateJobNumber(): Promise<string> {
    const count = await this.prisma.jobRequest.count();
    const nextSeq = 4800 + count + 1;
    return `VGJ-${String(nextSeq).padStart(6, '0')}`;
  }

  /**
   * Generates a secure random 4-digit delivery confirmation code
   */
  private generateDeliveryCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Creates a new customer load request, runs pricing algorithm, and notifies staff quote queue.
   */
  async createRequest(
    userId: string,
    dto: CreateJobRequestDto,
    agentId?: string,
  ) {
    // Lookup or ensure customer profile
    let customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) {
      customer = await this.prisma.customer.create({ data: { userId } });
    }

    const jobNumber = await this.generateJobNumber();

    // Calculate preliminary pricing estimate
    const pricingEstimate = await this.pricingService.calculateQuote({
      vehicleType: dto.vehicleType,
      distanceKm: 28.5, // In production, calculated via PostGIS / Google Distance Matrix
      weightTonnes: dto.weightTonnes,
      isOversized: dto.isOversized,
      needLoadingHelp: dto.needLoadingHelp,
      needOffloadingHelp: dto.needOffloadingHelp,
      isHazardous: dto.isHazardous,
    });

    const jobRequest = await this.prisma.jobRequest.create({
      data: {
        jobNumber,
        customerId: customer.id,
        createdByAgentId: agentId || null,
        serviceGroup: dto.serviceGroup || ServiceCategoryGroup.TRANSPORT,
        bookingStatus: BookingStatus.SUBMITTED,
        equipmentTypeId: dto.equipmentTypeId || null,
        preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : null,
        vehicleType: dto.vehicleType,
        pickupAddress: dto.pickupAddress,
        pickupLandmark: dto.pickupLandmark,
        pickupContactName: dto.pickupContactName,
        pickupContactPhone: dto.pickupContactPhone,
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        deliveryAddress: dto.deliveryAddress,
        deliveryLandmark: dto.deliveryLandmark,
        deliveryContactName: dto.deliveryContactName,
        deliveryContactPhone: dto.deliveryContactPhone,
        deliveryLatitude: dto.deliveryLatitude,
        deliveryLongitude: dto.deliveryLongitude,
        extraStopsJson: dto.extraStopsJson || undefined,
        loadCategory: dto.loadCategory,
        description: dto.description,
        weightTonnes: dto.weightTonnes,
        isOversized: dto.isOversized || false,
        dimensionsText: dto.dimensionsText,
        needLoadingHelp: dto.needLoadingHelp || false,
        needOffloadingHelp: dto.needOffloadingHelp || false,
        isHazardous: dto.isHazardous || false,
        photoKeys: dto.photoKeys || [],
        voiceNoteKey: dto.voiceNoteKey,
        notes: dto.notes,
        ...(dto.projectDetail
          ? {
              projectDetail: {
                create: {
                  projectLocation: dto.projectDetail.projectLocation,
                  workDescription: dto.projectDetail.workDescription,
                  startDate: new Date(dto.projectDetail.startDate),
                  expectedDuration: dto.projectDetail.expectedDuration,
                  durationUnit: dto.projectDetail.durationUnit || 'DAYS',
                  workingCapacity: dto.projectDetail.workingCapacity,
                  siteAccessibility: dto.projectDetail.siteAccessibility,
                  operatorRequired: dto.projectDetail.operatorRequired ?? true,
                  fuelArrangement: dto.projectDetail.fuelArrangement || 'COMPANY_SUPPLIED',
                  transportNeeded: dto.projectDetail.transportNeeded ?? true,
                  specialInstructions: dto.projectDetail.specialInstructions,
                },
              },
            }
          : {}),
      },
      include: { projectDetail: true, equipmentType: true },
    });

    // Create Draft Quote
    const validUntil = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours validity
    const quote = await this.prisma.quote.create({
      data: {
        jobRequestId: jobRequest.id,
        version: 1,
        priceBreakdownJson: pricingEstimate.breakdown as any,
        totalMinorUnits: pricingEstimate.totalMinorUnits,
        depositMinorUnits: pricingEstimate.depositMinorUnits,
        validUntil,
        status: 'REQUESTED',
        createdById: agentId || null,
      },
    });

    this.logger.log(`[JOB-REQUEST] Created ${jobNumber} for customer ${userId}`);

    await this.auditService.log({
      actorId: agentId || userId,
      action: 'JOB_REQUEST_CREATED',
      entityName: 'JobRequest',
      entityId: jobRequest.id,
      afterState: { jobNumber, totalEstimate: pricingEstimate.totalMinorUnits.toString() },
    });

    if (this.notificationsService) {
      const customerUser = await this.prisma.user.findUnique({ where: { id: userId } });
      const equipName = jobRequest.equipmentType?.name || jobRequest.vehicleType;
      const locationText = jobRequest.projectDetail
        ? jobRequest.projectDetail.projectLocation
        : `${jobRequest.pickupAddress} to ${jobRequest.deliveryAddress}`;

      if (customerUser?.phone) {
        await this.notificationsService.sendSms(
          customerUser.phone,
          `Vagrova: Booking request ${jobNumber} (${equipName}) received. Our Booking Officer will contact you shortly with your quotation.`,
        );
      }

      const adminAlertPhone = process.env.ADMIN_ALERT_PHONE?.trim() || '+233302000000';
      await this.notificationsService.sendSms(
        adminAlertPhone,
        `Vagrova Admin Alert: New ${jobRequest.serviceGroup} request ${jobNumber} (${equipName}) from ${customerUser?.phone || dto.pickupContactPhone} at ${locationText}.`,
      );
    }

    return {
      jobRequest,
      quote: {
        ...quote,
        totalMinorUnits: quote.totalMinorUnits.toString(),
        depositMinorUnits: quote.depositMinorUnits.toString(),
      },
    };
  }

  /**
   * Admin Quote Queue: List all active customer requests requiring review, negotiation, or pricing.
   */
  async getAdminQueue() {
    const requests = await this.prisma.jobRequest.findMany({
      include: {
        customer: { include: { user: true } },
        equipmentType: true,
        projectDetail: true,
        assignedOfficer: { select: { id: true, name: true, phone: true, role: true } },
        communicationLogs: {
          include: { staff: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        quotes: {
          orderBy: { version: 'desc' },
          take: 3,
          include: {
            revisions: {
              orderBy: { version: 'desc' },
              include: { createdBy: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      ...r,
      equipmentType: r.equipmentType
        ? {
            ...r.equipmentType,
            baseRateMinor: r.equipmentType.baseRateMinor.toString(),
            unitRateMinor: r.equipmentType.unitRateMinor.toString(),
            mobilisationMinor: r.equipmentType.mobilisationMinor.toString(),
          }
        : null,
      quotes: r.quotes.map((q) => ({
        ...q,
        totalMinorUnits: q.totalMinorUnits.toString(),
        depositMinorUnits: q.depositMinorUnits.toString(),
        revisions: q.revisions.map((rev) => ({
          ...rev,
          proposedTotalMinor: rev.proposedTotalMinor.toString(),
          transportChargeMinor: rev.transportChargeMinor.toString(),
          rentalChargeMinor: rev.rentalChargeMinor.toString(),
          loadingChargeMinor: rev.loadingChargeMinor.toString(),
          mobilisationChargeMinor: rev.mobilisationChargeMinor.toString(),
          operationalChargeMinor: rev.operationalChargeMinor.toString(),
        })),
      })),
    }));
  }

  /**
   * Assigns a booking request to a Booking Officer and saves internal notes.
   */
  async assignBookingOfficer(
    staffId: string,
    jobRequestId: string,
    officerId?: string,
    internalNotes?: string,
  ) {
    const req = await this.prisma.jobRequest.findUnique({ where: { id: jobRequestId } });
    if (!req) throw new NotFoundException('Booking request not found');

    const updated = await this.prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: {
        assignedOfficerId: officerId || staffId,
        bookingStatus:
          req.bookingStatus === BookingStatus.SUBMITTED
            ? BookingStatus.UNDER_REVIEW
            : req.bookingStatus,
        ...(internalNotes !== undefined ? { internalNotes } : {}),
      },
    });

    await this.auditService.log({
      actorId: staffId,
      action: 'BOOKING_OFFICER_ASSIGNED',
      entityName: 'JobRequest',
      entityId: jobRequestId,
      afterState: { assignedOfficerId: updated.assignedOfficerId, bookingStatus: updated.bookingStatus },
    });

    return updated;
  }

  /**
   * Records official company-to-customer communication (phone, WhatsApp, email, in-app).
   */
  async logCommunication(
    staffId: string,
    jobRequestId: string,
    channel: string,
    summary: string,
  ) {
    const req = await this.prisma.jobRequest.findUnique({ where: { id: jobRequestId } });
    if (!req) throw new NotFoundException('Booking request not found');

    return this.prisma.communicationLog.create({
      data: {
        jobRequestId,
        staffId,
        channel: channel || 'PHONE',
        summary,
      },
      include: { staff: { select: { id: true, name: true } } },
    });
  }

  /**
   * Records a staff-negotiated price revision (transport, rental, loading, mobilisation, operational).
   */
  async recordNegotiationRevision(
    staffId: string,
    jobRequestId: string,
    dto: {
      transportChargeMinor?: string | number;
      rentalChargeMinor?: string | number;
      loadingChargeMinor?: string | number;
      mobilisationChargeMinor?: string | number;
      operationalChargeMinor?: string | number;
      proposedTotalMinor?: string | number;
      negotiationNotes?: string;
    },
  ) {
    const req = await this.prisma.jobRequest.findUnique({ where: { id: jobRequestId } });
    if (!req) throw new NotFoundException('Booking request not found');

    let quote = await this.prisma.quote.findFirst({
      where: { jobRequestId },
      orderBy: { version: 'desc' },
    });

    const t = BigInt(dto.transportChargeMinor ?? 0);
    const r = BigInt(dto.rentalChargeMinor ?? 0);
    const l = BigInt(dto.loadingChargeMinor ?? 0);
    const m = BigInt(dto.mobilisationChargeMinor ?? 0);
    const o = BigInt(dto.operationalChargeMinor ?? 0);
    const total = dto.proposedTotalMinor !== undefined ? BigInt(dto.proposedTotalMinor) : t + r + l + m + o;

    if (!quote) {
      quote = await this.prisma.quote.create({
        data: {
          jobRequestId,
          version: 1,
          priceBreakdownJson: {},
          totalMinorUnits: total,
          depositMinorUnits: (total * 30n) / 100n,
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
          status: 'REQUESTED',
          createdById: staffId,
        },
      });
    }

    const latestRev = await this.prisma.quotationRevision.findFirst({
      where: { quoteId: quote.id },
      orderBy: { version: 'desc' },
    });
    const nextRev = (latestRev?.version || 0) + 1;

    const revision = await this.prisma.quotationRevision.create({
      data: {
        quoteId: quote.id,
        version: nextRev,
        proposedTotalMinor: total,
        transportChargeMinor: t,
        rentalChargeMinor: r,
        loadingChargeMinor: l,
        mobilisationChargeMinor: m,
        operationalChargeMinor: o,
        negotiationNotes: dto.negotiationNotes,
        createdById: staffId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        totalMinorUnits: total,
        depositMinorUnits: (total * 30n) / 100n,
        priceBreakdownJson: {
          transportChargeMinor: t.toString(),
          rentalChargeMinor: r.toString(),
          loadingChargeMinor: l.toString(),
          mobilisationChargeMinor: m.toString(),
          operationalChargeMinor: o.toString(),
        },
      },
    });

    await this.prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: { bookingStatus: BookingStatus.NEGOTIATING },
    });

    await this.auditService.log({
      actorId: staffId,
      action: 'QUOTATION_REVISION_RECORDED',
      entityName: 'Quote',
      entityId: quote.id,
      afterState: { revision: nextRev, proposedTotalMinor: total.toString() },
    });

    return {
      ...revision,
      proposedTotalMinor: revision.proposedTotalMinor.toString(),
      transportChargeMinor: revision.transportChargeMinor.toString(),
      rentalChargeMinor: revision.rentalChargeMinor.toString(),
      loadingChargeMinor: revision.loadingChargeMinor.toString(),
      mobilisationChargeMinor: revision.mobilisationChargeMinor.toString(),
      operationalChargeMinor: revision.operationalChargeMinor.toString(),
    };
  }

  /**
   * Staff / Admin sends formal quote to the customer with price breakdown.
   */
  async sendQuote(adminId: string, jobRequestId: string, dto: SendQuoteDto) {
    const jobRequest = await this.prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      include: { customer: { include: { user: true } } },
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    const latestQuote = await this.prisma.quote.findFirst({
      where: { jobRequestId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestQuote?.version || 0) + 1;

    const validityHours = dto.validityHours || 48;
    const validUntil = new Date(Date.now() + validityHours * 60 * 60 * 1000);

    const quote = await this.prisma.quote.create({
      data: {
        jobRequestId,
        version: nextVersion,
        priceBreakdownJson: dto.breakdown as any,
        totalMinorUnits: BigInt(dto.totalMinorUnits),
        depositMinorUnits: BigInt(dto.depositMinorUnits),
        validUntil,
        status: 'QUOTE_SENT',
        createdById: adminId,
      },
    });

    await this.prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: { bookingStatus: BookingStatus.QUOTED },
    });

    // In production, dispatch notification via Push, SMS, and WhatsApp:
    // "Vagrova: Your quote for {jobNumber} is ready (GHS {total}). Tap to view: https://vagrova.com/q/{id}"
    this.logger.log(
      `[QUOTE-DISPATCH] Sent quote ${quote.id} for ${jobRequest.jobNumber} to ${jobRequest.customer.user.phone}`
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'QUOTE_SENT_TO_CUSTOMER',
      entityName: 'Quote',
      entityId: quote.id,
      afterState: {
        jobNumber: jobRequest.jobNumber,
        total: dto.totalMinorUnits,
        deposit: dto.depositMinorUnits,
      },
    });

    return {
      ...quote,
      totalMinorUnits: quote.totalMinorUnits.toString(),
      depositMinorUnits: quote.depositMinorUnits.toString(),
    };
  }

  /**
   * Customer accepts or declines the quote.
   */
  async respondQuote(userId: string, quoteId: string, dto: RespondQuoteDto) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        jobRequest: {
          include: { customer: true },
        },
        job: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Quotation not found');
    }

    if (quote.jobRequest.customer.userId !== userId) {
      throw new ForbiddenException('You are not authorized to respond to this quotation.');
    }

    if (quote.status === 'ACCEPTED' && quote.job && dto.action === QuoteResponseAction.ACCEPT) {
      return {
        success: true,
        job: {
          id: quote.job.id,
          jobNumber: quote.job.jobNumber,
          status: quote.job.status,
          depositDueMinorUnits: quote.depositMinorUnits.toString(),
          currency: quote.currency,
        },
      };
    }

    if (quote.status !== 'QUOTE_SENT' && quote.status !== 'REQUESTED') {
      throw new BadRequestException(`Quotation cannot be modified in status "${quote.status}".`);
    }

    if (new Date() > quote.validUntil) {
      throw new BadRequestException('This quotation has expired. Please request a refreshed quote.');
    }

    if (dto.action === QuoteResponseAction.DECLINE) {
      const updatedQuote = await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'DECLINED' },
      });

      await this.auditService.log({
        actorId: userId,
        action: 'QUOTE_DECLINED',
        entityName: 'Quote',
        entityId: quoteId,
        afterState: { reason: dto.declineReason },
      });

      return { success: true, status: 'DECLINED' };
    }

    // Customer ACCEPTED: Create initial Job record with delivery code
    const deliveryCode = this.generateDeliveryCode();

    const job = await this.prisma.job.create({
      data: {
        jobNumber: quote.jobRequest.jobNumber,
        jobRequestId: quote.jobRequestId,
        quoteId: quote.id,
        status: 'BOOKED',
        deliveryCode,
        bookedAt: new Date(),
      },
    });

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    this.logger.log(`[JOB-BOOKED] Job ${job.jobNumber} accepted. Delivery code: ${deliveryCode}`);

    await this.auditService.log({
      actorId: userId,
      action: 'QUOTE_ACCEPTED_JOB_BOOKED',
      entityName: 'Job',
      entityId: job.id,
      afterState: { jobNumber: job.jobNumber, status: 'BOOKED' },
    });

    return {
      success: true,
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
        depositDueMinorUnits: quote.depositMinorUnits.toString(),
        currency: quote.currency,
      },
    };
  }

  /**
   * Lists all booking requests & official quotes belonging to the authenticated customer.
   */
  async listMyQuoteRequests(userId: string) {
    return this.prisma.jobRequest.findMany({
      where: {
        customer: { userId },
      },
      include: {
        equipmentType: { select: { name: true, pricingModel: true } },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            deliveryCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

