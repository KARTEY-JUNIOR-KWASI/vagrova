import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { LocationPingDto } from './dto/location-ping.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('ping')
  @Roles(UserRole.DRIVER, UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async recordLocationPing(
    @CurrentUser() user: User,
    @Body() dto: LocationPingDto,
  ) {
    return this.trackingService.recordLocationPing(user, dto);
  }

  @Get('jobs/:id')
  async getLiveTripTracking(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
  ) {
    const data = await this.trackingService.getLiveTripTracking(user, jobId);
    if (!data) {
      throw new NotFoundException('Trip not found');
    }
    return data;
  }
}

