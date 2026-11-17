import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TrackingGateway } from './tracking.gateway';
import { LocationPingDto } from './dto/location-ping.dto';
import { User, UserRole } from '@prisma/client';

const STAFF_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.DISPATCHER,
  UserRole.AGENT,
  UserRole.FINANCE,
];

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TrackingGateway,
  ) {}

  /**
   * Ingests high-precision GPS telemetry ping from driver's mobile phone.
   * Verifies the authenticated user owns or is actively assigned to the truck.
   */
  async recordLocationPing(user: User, dto: LocationPingDto) {
    const truck = await this.prisma.truck.findUnique({
      where: { id: dto.truckId },
      include: {
        owner: true,
        assignments: {
          where: { isActive: true },
          include: { driver: true },
        },
      },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    const isStaff = STAFF_ROLES.includes(user.role);
    const isOwner = truck.owner.userId === user.id;
    const isAssignedDriver = truck.assignments.some((a) => a.driver.userId === user.id);

    if (!isStaff && !isOwner && !isAssignedDriver) {
      throw new ForbiddenException('You are not authorized to publish location for this truck.');
    }

    const now = new Date();

    // 1. Update truck current location & persist historical observation
    await this.prisma.$transaction([
      this.prisma.truck.update({
        where: { id: dto.truckId },
        data: {
          latitude: dto.latitude,
          longitude: dto.longitude,
          lastLocationAt: now,
        },
      }),
      this.prisma.driverLocationObservation.create({
        data: {
          truckId: dto.truckId,
          jobId: dto.jobId || null,
          latitude: dto.latitude,
          longitude: dto.longitude,
          heading: dto.heading ?? null,
          speed: dto.speed ?? null,
          accuracy: dto.accuracy ?? null,
          recordedAt: now,
        },
      }),
    ]);

    // 2. Broadcast via WebSocket if truck is currently engaged on an active job
    if (dto.jobId) {
      this.gateway.broadcastTruckLocation(dto.jobId, {
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        updatedAt: now,
      });
    }

    return { success: true, timestamp: now };
  }

  /**
   * Returns authoritative live tracking state including weak-data fallback indicators.
   * Enforces strict object-level authorization and strips deliveryCode from non-customers.
   */
  async getLiveTripTracking(user: User, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        truck: {
          include: {
            owner: { include: { user: true } },
          },
        },
        driver: { include: { user: true } },
        jobRequest: {
          include: { customer: true },
        },
      },
    });

    if (!job) {
      return null;
    }

    const isCustomerOwner = job.jobRequest.customer.userId === user.id;
    const isAssignedDriver = job.driver?.userId === user.id;
    const isTruckOwner = job.truck?.owner.userId === user.id;
    const isStaff = STAFF_ROLES.includes(user.role);

    if (!isCustomerOwner && !isAssignedDriver && !isTruckOwner && !isStaff) {
      throw new ForbiddenException('You are not authorized to view tracking for this job.');
    }

    const lastUpdated = job.truck?.lastLocationAt;
    const now = new Date();
    let freshnessMinutes = 0;
    if (lastUpdated) {
      freshnessMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / 60000);
    }

    const plainStatus =
      freshnessMinutes > 5
        ? `Driver last known position recorded ${freshnessMinutes} minutes ago (Weak connection)`
        : `Live GPS active · Driver en route`;

    return {
      jobId: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      plainStatus,
      // Only expose the 4-digit delivery confirmation code to the owning customer
      ...(isCustomerOwner ? { deliveryCode: job.deliveryCode } : {}),
      pickup: {
        address: job.jobRequest.pickupAddress,
        landmark: job.jobRequest.pickupLandmark,
        contactName: job.jobRequest.pickupContactName,
        contactPhone: job.jobRequest.pickupContactPhone,
      },
      delivery: {
        address: job.jobRequest.deliveryAddress,
        landmark: job.jobRequest.deliveryLandmark,
        contactName: job.jobRequest.deliveryContactName,
        contactPhone: job.jobRequest.deliveryContactPhone,
      },
      truck: job.truck
        ? {
            plate: job.truck.plate,
            type: job.truck.type,
            makeModel: `${job.truck.make} ${job.truck.model}`,
            latitude: job.truck.latitude ? Number(job.truck.latitude) : null,
            longitude: job.truck.longitude ? Number(job.truck.longitude) : null,
            lastLocationAt: job.truck.lastLocationAt,
          }
        : null,
      driver: job.driver
        ? {
            name: job.driver.user.name,
            phone: job.driver.user.phone,
            rating: Number(job.driver.rating),
          }
        : null,
    };
  }
}

