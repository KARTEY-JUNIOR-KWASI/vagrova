import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface RecordAuditParams {
  actorId?: string;
  action: string;
  entityName: string;
  entityId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable audit log entry.
   */
  async log(params: RecordAuditParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          entityName: params.entityName,
          entityId: params.entityId,
          beforeState: params.beforeState ? (params.beforeState as any) : undefined,
          afterState: params.afterState ? (params.afterState as any) : undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      this.logger.log(
        `[AUDIT] Action: ${params.action} on ${params.entityName}:${params.entityId} by Actor: ${params.actorId || 'SYSTEM'}`
      );
    } catch (err: any) {
      // In production, fallback to append-only syslog or monitoring alert if DB write fails
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
    }
  }
}

