import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterTruckDto } from './dto/register-truck.dto';
import { SubmitDocumentDto } from './dto/submit-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import {
  DocumentStatus,
  TruckStatus,
  VerificationStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Complete provider profile registration (Owner, Driver, or Both).
   */
  async registerProviderProfile(userId: string, dto: RegisterProviderDto) {
    const existing = await this.prisma.provider.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Provider profile already exists for this user.');
    }

    const provider = await this.prisma.provider.create({
      data: {
        userId,
        kind: dto.kind,
        homeTown: dto.homeTown,
        nextOfKinName: dto.nextOfKinName,
        nextOfKinPhone: dto.nextOfKinPhone,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    // Update user role based on kind
    const role = dto.kind === 'OWNER' ? UserRole.OWNER : UserRole.DRIVER;
    await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'PROVIDER_PROFILE_REGISTERED',
      entityName: 'Provider',
      entityId: provider.id,
      afterState: provider as any,
    });

    return provider;
  }

  /**
   * Register a heavy vehicle/truck under an owner's account.
   */
  async registerTruck(userId: string, dto: RegisterTruckDto) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new BadRequestException('User must have an active provider profile before registering vehicles.');
    }

    const cleanPlate = dto.plate.trim().toUpperCase();
    const existingTruck = await this.prisma.truck.findUnique({ where: { plate: cleanPlate } });
    if (existingTruck) {
      throw new ConflictException(`A vehicle with plate number "${cleanPlate}" is already registered on Vagrova.`);
    }

    const truck = await this.prisma.truck.create({
      data: {
        ownerId: provider.id,
        plate: cleanPlate,
        type: dto.type,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        capacityTonnes: dto.capacityTonnes,
        dimensionsJson: dto.dimensionsJson || undefined,
        features: dto.features || [],
        photosJson: dto.photosJson || undefined,
        status: TruckStatus.OFFLINE, // Remains offline until documents are verified
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'TRUCK_REGISTERED',
      entityName: 'Truck',
      entityId: truck.id,
      afterState: truck as any,
    });

    return truck;
  }

  /**
   * Upload / submit a regulatory or identification document.
   */
  async submitDocument(userId: string, dto: SubmitDocumentDto) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    if (dto.truckId) {
      const truck = await this.prisma.truck.findUnique({ where: { id: dto.truckId } });
      if (!truck || truck.ownerId !== provider.id) {
        throw new BadRequestException('Vehicle not found or does not belong to provider.');
      }
    }

    const doc = await this.prisma.document.create({
      data: {
        providerId: provider.id,
        truckId: dto.truckId || null,
        type: dto.type,
        fileKey: dto.fileKey,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        status: DocumentStatus.WAITING,
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'DOCUMENT_SUBMITTED',
      entityName: 'Document',
      entityId: doc.id,
      afterState: doc as any,
    });

    return doc;
  }

  /**
   * Admin verification: Approve or reject an uploaded document.
   */
  async reviewDocument(reviewerId: string, documentId: string, dto: ReviewDocumentDto) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { provider: true, truck: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (dto.status === DocumentStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Rejection reason is required when rejecting a verification document.');
    }

    const beforeState = { ...doc };

    const updatedDoc = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: dto.status,
        reviewerId,
        rejectionReason: dto.status === DocumentStatus.REJECTED ? dto.rejectionReason : null,
      },
    });

    // Check if all truck documents are approved -> unlock truck
    if (doc.truckId && dto.status === DocumentStatus.APPROVED) {
      await this.evaluateTruckEligibility(doc.truckId);
    }

    // Check if all provider identity docs are approved -> approve provider
    if (doc.providerId && dto.status === DocumentStatus.APPROVED) {
      await this.evaluateProviderEligibility(doc.providerId);
    }

    // Immutable Audit Log
    await this.auditService.log({
      actorId: reviewerId,
      action: `DOCUMENT_${dto.status}`,
      entityName: 'Document',
      entityId: documentId,
      beforeState: beforeState as any,
      afterState: updatedDoc as any,
    });

    return updatedDoc;
  }

  /**
   * Unlocks truck status if all required vehicle documents are currently active & approved.
   */
  private async evaluateTruckEligibility(truckId: string) {
    const docs = await this.prisma.document.findMany({ where: { truckId } });
    const hasApprovedRoadworthy = docs.some(
      (d) => d.type === 'ROADWORTHY_CERTIFICATE' && d.status === DocumentStatus.APPROVED
    );
    const hasApprovedInsurance = docs.some(
      (d) => d.type === 'INSURANCE' && d.status === DocumentStatus.APPROVED
    );
    const hasApprovedRegistration = docs.some(
      (d) => d.type === 'VEHICLE_REGISTRATION' && d.status === DocumentStatus.APPROVED
    );

    if (hasApprovedRoadworthy && hasApprovedInsurance && hasApprovedRegistration) {
      await this.prisma.truck.update({
        where: { id: truckId },
        data: { status: TruckStatus.AVAILABLE },
      });
      this.logger.log(`[ELIGIBILITY] Truck ${truckId} approved and marked AVAILABLE.`);
    }
  }

  /**
   * Approves provider verification if identity documents are verified.
   */
  private async evaluateProviderEligibility(providerId: string) {
    const docs = await this.prisma.document.findMany({ where: { providerId } });
    const hasApprovedId = docs.some(
      (d) => (d.type === 'NATIONAL_ID' || d.type === 'DRIVERS_LICENCE') && d.status === DocumentStatus.APPROVED
    );

    if (hasApprovedId) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: { verificationStatus: VerificationStatus.APPROVED },
      });
      this.logger.log(`[ELIGIBILITY] Provider ${providerId} promoted to APPROVED.`);
    }
  }

  /**
   * List pending verification items for the Admin split-view queue.
   */
  async listVerificationQueue() {
    return this.prisma.document.findMany({
      where: { status: DocumentStatus.WAITING },
      include: {
        provider: {
          include: { user: true },
        },
        truck: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Updates truck availability (AVAILABLE / BUSY / OFFLINE).
   * Strictly prevents trucks with expired documents from going AVAILABLE.
   */
  async updateTruckAvailability(
    userId: string,
    truckId: string,
    status: TruckStatus,
  ) {
    const ALLOWED: TruckStatus[] = [
      TruckStatus.AVAILABLE,
      TruckStatus.BUSY,
      TruckStatus.OFFLINE,
    ];
    if (!ALLOWED.includes(status)) {
      throw new BadRequestException('Availability must be AVAILABLE, BUSY, or OFFLINE.');
    }

    const truck = await this.prisma.truck.findUnique({
      where: { id: truckId },
      include: {
        owner: true,
        assignments: { where: { isActive: true }, include: { driver: true } },
      },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    const isOwner = truck.owner.userId === userId;
    const isAssignedDriver = truck.assignments.some((a) => a.driver.userId === userId);
    if (!isOwner && !isAssignedDriver) {
      throw new BadRequestException('You are not authorized to change this truck availability.');
    }

    if (truck.status === TruckStatus.BLOCKED_EXPIRED_DOCS && status === TruckStatus.AVAILABLE) {
      throw new BadRequestException(
        'Truck is blocked due to expired documents. Renew and verify documents before going Available.',
      );
    }

    const updated = await this.prisma.truck.update({
      where: { id: truckId },
      data: { status },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'TRUCK_AVAILABILITY_CHANGED',
      entityName: 'Truck',
      entityId: truckId,
      beforeState: { status: truck.status },
      afterState: { status },
    });

    return updated;
  }
}

