import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PricingModel, User, UserRole, VehicleType } from '@prisma/client';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('categories')
  async getPublicCatalog() {
    return this.equipmentService.listPublicCatalog();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
  )
  async listAllAdmin() {
    return this.equipmentService.listAllAdmin();
  }

  @Post('admin/types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER, UserRole.OPERATIONS_MANAGER)
  async createType(
    @CurrentUser() user: User,
    @Body()
    body: {
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
    return this.equipmentService.createEquipmentType(user.id, body);
  }

  @Patch('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER, UserRole.OPERATIONS_MANAGER)
  async updateType(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.equipmentService.updateEquipmentType(user.id, id, body);
  }
}
