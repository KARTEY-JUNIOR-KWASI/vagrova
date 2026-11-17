import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CallCenterService } from './call-center.service';
import { RequestCallbackDto } from './dto/request-callback.dto';
import { BookOnBehalfDto } from './dto/book-on-behalf.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('call-center')
export class CallCenterController {
  constructor(private readonly callCenterService: CallCenterService) {}

  @Post('request-callback')
  @HttpCode(HttpStatus.OK)
  async requestCallback(@Body() dto: RequestCallbackDto) {
    return this.callCenterService.requestCallback(dto);
  }

  @Get('admin/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER)
  async getCallbackQueue() {
    return this.callCenterService.getCallbackQueue();
  }

  @Get('admin/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAgentPerformance() {
    return this.callCenterService.getAgentPerformance();
  }

  @Post('admin/book-on-behalf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async bookOnBehalf(
    @CurrentUser() user: User,
    @Body() dto: BookOnBehalfDto,
  ) {
    return this.callCenterService.bookOnBehalf(user.id, dto);
  }
}

