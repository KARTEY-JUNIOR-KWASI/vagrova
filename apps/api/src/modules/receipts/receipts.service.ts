import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

const STAFF_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.DISPATCHER,
  UserRole.AGENT,
  UserRole.FINANCE,
];

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates official Vagrova Consignment Note & Delivery Receipt structure.
   */
  async getConsignmentNoteReceipt(user: User, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        OR: [{ id: jobId }, { jobNumber: jobId }],
      },
      include: {
        jobRequest: {
          include: { customer: { include: { user: true } } },
        },
        quote: true,
        truck: {
          include: { owner: { include: { user: true } } },
        },
        driver: { include: { user: true } },
        payments: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job consignment not found for identifier: ${jobId}`);
    }

    const isCustomerOwner = job.jobRequest.customer.userId === user.id;
    const isAssignedDriver = job.driver?.userId === user.id;
    const isTruckOwner = job.truck?.owner.userId === user.id;
    const isStaff = STAFF_ROLES.includes(user.role);

    if (!isCustomerOwner && !isAssignedDriver && !isTruckOwner && !isStaff) {
      throw new ForbiddenException('You are not authorized to view this consignment receipt.');
    }

    const { jobRequest, quote, truck, driver, payments } = job;

    // Determine official stamp
    let stamp: 'QUOTE' | 'BOOKED' | 'IN TRANSIT' | 'DELIVERED' | 'PAID' | 'DISPUTED' = 'BOOKED';
    if (job.status === 'IN_TRANSIT' || job.status === 'LOADED') stamp = 'IN TRANSIT';
    else if (job.status === 'DELIVERED' || job.status === 'COMPLETED') stamp = 'DELIVERED';
    else if (job.status === 'DISPUTED') stamp = 'DISPUTED';

    const totalPesewas = Number(quote.totalMinorUnits);
    const depositPesewas = Number(quote.depositMinorUnits);
    const balancePesewas = totalPesewas - depositPesewas;

    return {
      consignmentHeader: {
        title: 'OFFICIAL WAYBILL & CONSIGNMENT NOTE',
        jobNumber: job.jobNumber,
        stamp,
        issuedDate: job.createdAt,
      },
      consignorCustomer: {
        name: jobRequest.customer.companyName || jobRequest.customer.user.name,
        phone: jobRequest.customer.user.phone,
        pickupPoint: jobRequest.pickupAddress,
        pickupLandmark: jobRequest.pickupLandmark,
        siteContact: `${jobRequest.pickupContactName} (${jobRequest.pickupContactPhone})`,
      },
      consigneeDelivery: {
        deliveryPoint: jobRequest.deliveryAddress,
        deliveryLandmark: jobRequest.deliveryLandmark,
        receiverContact: `${jobRequest.deliveryContactName} (${jobRequest.deliveryContactPhone})`,
      },
      carrierAllocation: {
        driverName: driver?.user.name || 'Unassigned',
        driverPhone: driver?.user.phone || '—',
        truckPlate: truck?.plate || '—',
        vehicleType: truck?.type || jobRequest.vehicleType,
        capacityTonnes: truck ? Number(truck.capacityTonnes) : '—',
      },
      cargoSpecification: {
        description: jobRequest.description,
        category: jobRequest.loadCategory,
        weightTonnes: Number(jobRequest.weightTonnes),
        dimensions: jobRequest.dimensionsText || 'Standard',
        specialHandling: [
          jobRequest.needLoadingHelp ? 'Site Loading Equipment' : null,
          jobRequest.needOffloadingHelp ? 'Site Offloading Equipment' : null,
          jobRequest.isOversized ? 'Oversized Transit Escort' : null,
          jobRequest.isHazardous ? 'Hazardous Goods Compliance' : null,
        ].filter(Boolean),
      },
      chainOfCustodyTimestamps: {
        requestedAt: jobRequest.createdAt,
        bookedAt: job.bookedAt,
        loadedAt: job.loadedAt,
        deliveredAt: job.deliveredAt,
        deliveryCodeVerified: Boolean(job.deliveredAt),
      },
      financialSummary: {
        currency: quote.currency,
        totalQuotedGHS: (totalPesewas / 100).toFixed(2),
        depositPaidGHS: (depositPesewas / 100).toFixed(2),
        balancePayableGHS: (balancePesewas / 100).toFixed(2),
        priceBreakdown: quote.priceBreakdownJson,
        confirmedPaymentsCount: payments.filter((p) => p.status === 'CONFIRMED').length,
      },
    };
  }
}

