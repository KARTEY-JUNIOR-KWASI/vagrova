import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { PricingModel, VehicleType } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private serializeType(t: any) {
    return {
      ...t,
      baseRateMinor: t.baseRateMinor.toString(),
      unitRateMinor: t.unitRateMinor.toString(),
      mobilisationMinor: t.mobilisationMinor.toString(),
    };
  }

  async listPublicCatalog() {
    const categories = await this.prisma.equipmentCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        equipmentTypes: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    return categories.map((c) => ({
      ...c,
      equipmentTypes: c.equipmentTypes.map((t) => this.serializeType(t)),
    }));
  }

  async listAllAdmin() {
    const categories = await this.prisma.equipmentCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        equipmentTypes: {
          orderBy: { name: 'asc' },
        },
      },
    });

    return categories.map((c) => ({
      ...c,
      equipmentTypes: c.equipmentTypes.map((t) => this.serializeType(t)),
    }));
  }

  async createEquipmentType(
    actorId: string,
    dto: {
      categoryId: string;
      code: string;
      name: string;
      pricingModel: PricingModel;
      legacyVehicleType?: VehicleType;
      baseRateMinor?: string | number;
      unitRateMinor?: string | number;
      mobilisationMinor?: string | number;
      description?: string;
      isProvisional?: boolean;
    },
  ) {
    const cat = await this.prisma.equipmentCategory.findUnique({ where: { id: dto.categoryId } });
    if (!cat) throw new NotFoundException('Equipment category not found');

    const normalizedCode = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = await this.prisma.equipmentType.findUnique({ where: { code: normalizedCode } });
    if (existing) throw new BadRequestException(`Equipment code "${normalizedCode}" already exists`);

    const created = await this.prisma.equipmentType.create({
      data: {
        categoryId: dto.categoryId,
        code: normalizedCode,
        name: dto.name.trim(),
        pricingModel: dto.pricingModel,
        legacyVehicleType: dto.legacyVehicleType ?? null,
        baseRateMinor: BigInt(dto.baseRateMinor ?? 0),
        unitRateMinor: BigInt(dto.unitRateMinor ?? 0),
        mobilisationMinor: BigInt(dto.mobilisationMinor ?? 0),
        description: dto.description?.trim() || null,
        isProvisional: Boolean(dto.isProvisional),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'EQUIPMENT_TYPE_CREATED',
      entityName: 'EquipmentType',
      entityId: created.id,
      afterState: { code: created.code, name: created.name, pricingModel: created.pricingModel },
    });

    return this.serializeType(created);
  }

  async updateEquipmentType(
    actorId: string,
    id: string,
    dto: {
      name?: string;
      pricingModel?: PricingModel;
      baseRateMinor?: string | number;
      unitRateMinor?: string | number;
      mobilisationMinor?: string | number;
      description?: string;
      isActive?: boolean;
      isProvisional?: boolean;
    },
  ) {
    const existing = await this.prisma.equipmentType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Equipment type not found');

    const updated = await this.prisma.equipmentType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.pricingModel !== undefined ? { pricingModel: dto.pricingModel } : {}),
        ...(dto.baseRateMinor !== undefined ? { baseRateMinor: BigInt(dto.baseRateMinor) } : {}),
        ...(dto.unitRateMinor !== undefined ? { unitRateMinor: BigInt(dto.unitRateMinor) } : {}),
        ...(dto.mobilisationMinor !== undefined ? { mobilisationMinor: BigInt(dto.mobilisationMinor) } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isProvisional !== undefined ? { isProvisional: dto.isProvisional } : {}),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'EQUIPMENT_TYPE_UPDATED',
      entityName: 'EquipmentType',
      entityId: updated.id,
      beforeState: { isActive: existing.isActive, pricingModel: existing.pricingModel },
      afterState: { isActive: updated.isActive, pricingModel: updated.pricingModel },
    });

    return this.serializeType(updated);
  }
}
