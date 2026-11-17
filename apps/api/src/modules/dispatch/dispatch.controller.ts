import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { BroadcastOffersDto } from './dto/broadcast-offers.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { AdvanceTripStepDto } from './dto/advance-trip-step.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole, RentalStatus } from '@prisma/client';

@Controller('dispatch')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('jobs/my')
  async listMyJobs(@CurrentUser() user: User) {
    return this.dispatchService.listMyJobs(user.id);
  }

  @Post('jobs/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelJob(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
    @Body() body: { reason: string },
  ) {
    return this.dispatchService.cancelJob(user.id, user.role, jobId, body.reason);
  }

  @Get('admin/jobs')
  @Roles(
    UserRole.DISPATCHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FLEET_MANAGER,
  )
  async listAdminJobs() {
    return this.dispatchService.listAdminJobs();
  }

  @Post('admin/jobs/:id/assign')
  @Roles(
    UserRole.DISPATCHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FLEET_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async assignEquipmentAndOperator(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
    @Body()
    body: {
      truckId: string;
      driverId: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      operationalNotes?: string;
      allowUnpaidException?: boolean;
    },
  ) {
    return this.dispatchService.assignEquipmentAndOperator(user.id, user.role, jobId, body);
  }

  @Get('driver/assignments')
  @Roles(UserRole.DRIVER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDriverAssignments(@CurrentUser() user: User) {
    return this.dispatchService.getDriverAssignments(user.id);
  }

  @Post('jobs/:id/rental-progress')
  @Roles(
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DISPATCHER,
  )
  @HttpCode(HttpStatus.OK)
  async updateRentalProgress(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
    @Body() body: { status: RentalStatus; loggedHours?: number; operatorNotes?: string },
  ) {
    return this.dispatchService.updateRentalProgress(user.id, jobId, body);
  }

  @Get('jobs/:id/matching-trucks')
  @Roles(UserRole.DISPATCHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMatchingTrucks(@Param('id') jobId: string) {
    return this.dispatchService.findMatchingTrucks(jobId);
  }

  @Post('offers/broadcast')
  @Roles(UserRole.DISPATCHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async broadcastOffers(
    @CurrentUser() user: User,
    @Body() dto: BroadcastOffersDto,
  ) {
    return this.dispatchService.broadcastOffers(user.id, dto);
  }

  @Post('offers/:id/respond')
  @Roles(UserRole.DRIVER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async respondToOffer(
    @CurrentUser() user: User,
    @Param('id') offerId: string,
    @Body() dto: RespondOfferDto,
  ) {
    return this.dispatchService.respondToOffer(user.id, offerId, dto);
  }

  @Post('jobs/:id/advance-step')
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async advanceTripStep(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
    @Body() dto: AdvanceTripStepDto,
  ) {
    return this.dispatchService.advanceTripStep(user.id, jobId, dto);
  }
}

