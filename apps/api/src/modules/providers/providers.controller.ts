import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterTruckDto } from './dto/register-truck.dto';
import { SubmitDocumentDto } from './dto/submit-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { TruckStatus, User, UserRole } from '@prisma/client';

@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @CurrentUser() user: User,
    @Body() dto: RegisterProviderDto,
  ) {
    return this.providersService.registerProviderProfile(user.id, dto);
  }

  @Post('trucks')
  @Roles(UserRole.OWNER, UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async registerTruck(
    @CurrentUser() user: User,
    @Body() dto: RegisterTruckDto,
  ) {
    return this.providersService.registerTruck(user.id, dto);
  }

  @Patch('trucks/:id/availability')
  @Roles(UserRole.OWNER, UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTruckAvailability(
    @CurrentUser() user: User,
    @Param('id') truckId: string,
    @Body() body: { status: TruckStatus },
  ) {
    return this.providersService.updateTruckAvailability(user.id, truckId, body.status);
  }

  @Post('documents')
  @Roles(UserRole.OWNER, UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async submitDocument(
    @CurrentUser() user: User,
    @Body() dto: SubmitDocumentDto,
  ) {
    return this.providersService.submitDocument(user.id, dto);
  }

  @Get('admin/verification-queue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER)
  async getVerificationQueue() {
    return this.providersService.listVerificationQueue();
  }

  @Get('admin/trucks')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER)
  async listAdminTrucks() {
    return this.providersService.listAdminTrucks();
  }

  @Post('admin/documents/:id/review')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async reviewDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: ReviewDocumentDto,
  ) {
    return this.providersService.reviewDocument(user.id, documentId, dto);
  }
}

