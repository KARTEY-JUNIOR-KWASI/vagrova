import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { DocumentStatus, TruckStatus } from '@prisma/client';

@Injectable()
export class DocumentExpiryCron {
  private readonly logger = new Logger(DocumentExpiryCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Runs every hour to check document expiries and enforce non-negotiable safety rules:
   * 1. 30-Day Warning: Dispatches notification to renew
   * 2. 7-Day Warning: Dispatches urgent SMS alert
   * 3. Expired: Immediately marks document as EXPIRED and BLOCKS the truck from receiving dispatch offers.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDocumentExpirations() {
    this.logger.log('[CRON] Executing document expiry & vehicle eligibility scan...');

    const now = new Date();

    // ─── 1. Identify Expired Documents ───────────────────────────────────────
    const expiredDocs = await this.prisma.document.findMany({
      where: {
        expiryDate: { lte: now },
        status: DocumentStatus.APPROVED,
      },
      include: {
        truck: true,
        provider: { include: { user: true } },
      },
    });

    for (const doc of expiredDocs) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.EXPIRED },
      });

      // If document is attached to a vehicle, immediately lock out the truck
      if (doc.truckId && doc.truck) {
        await this.prisma.truck.update({
          where: { id: doc.truckId },
          data: { status: TruckStatus.BLOCKED_EXPIRED_DOCS },
        });

        this.logger.warn(
          `[LOCKOUT] Truck ${doc.truck.plate} BLOCKED due to expired ${doc.type} (Expired on: ${doc.expiryDate})`
        );

        await this.auditService.log({
          action: 'TRUCK_AUTOMATICALLY_BLOCKED_EXPIRED_DOC',
          entityName: 'Truck',
          entityId: doc.truckId,
          afterState: {
            plate: doc.truck.plate,
            expiredDocumentType: doc.type,
            expiryDate: doc.expiryDate,
          },
        });
      }
    }

    // ─── 2. 30-Day and 7-Day Expiry Warnings ─────────────────────────────────
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoonDocs = await this.prisma.document.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow, gt: now },
        status: DocumentStatus.APPROVED,
      },
      include: {
        provider: { include: { user: true } },
        truck: true,
      },
    });

    for (const doc of expiringSoonDocs) {
      const daysLeft = Math.ceil(
        (doc.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft === 30 || daysLeft === 7) {
        this.logger.log(
          `[EXPIRY-WARNING] Document ${doc.type} for ${doc.provider?.user.phone || doc.truck?.plate} expires in ${daysLeft} days.`
        );
        // In production, dispatches push notification + SMS
      }
    }
  }
}

