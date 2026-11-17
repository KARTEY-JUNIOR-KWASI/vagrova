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
import { QuotesService } from './quotes.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { RespondQuoteDto } from './dto/respond-quote.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @CurrentUser() user: User,
    @Body() dto: CreateJobRequestDto,
  ) {
    return this.quotesService.createRequest(user.id, dto);
  }

  @Get('admin/queue')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DISPATCHER,
    UserRole.AGENT,
  )
  async getAdminQueue() {
    return this.quotesService.getAdminQueue();
  }

  @Post('admin/requests/:id/assign')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.BOOKING_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async assignOfficer(
    @CurrentUser() user: User,
    @Param('id') jobRequestId: string,
    @Body() body: { officerId?: string; internalNotes?: string },
  ) {
    return this.quotesService.assignBookingOfficer(user.id, jobRequestId, body.officerId, body.internalNotes);
  }

  @Post('admin/requests/:id/communication')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.AGENT,
  )
  @HttpCode(HttpStatus.CREATED)
  async logCommunication(
    @CurrentUser() user: User,
    @Param('id') jobRequestId: string,
    @Body() body: { channel: string; summary: string },
  ) {
    return this.quotesService.logCommunication(user.id, jobRequestId, body.channel, body.summary);
  }

  @Post('admin/requests/:id/negotiate')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  @HttpCode(HttpStatus.CREATED)
  async negotiate(
    @CurrentUser() user: User,
    @Param('id') jobRequestId: string,
    @Body()
    body: {
      transportChargeMinor?: string | number;
      rentalChargeMinor?: string | number;
      loadingChargeMinor?: string | number;
      mobilisationChargeMinor?: string | number;
      operationalChargeMinor?: string | number;
      proposedTotalMinor?: string | number;
      negotiationNotes?: string;
    },
  ) {
    return this.quotesService.recordNegotiationRevision(user.id, jobRequestId, body);
  }

  @Post('admin/requests/:id/send')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async sendQuote(
    @CurrentUser() user: User,
    @Param('id') jobRequestId: string,
    @Body() dto: SendQuoteDto,
  ) {
    return this.quotesService.sendQuote(user.id, jobRequestId, dto);
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  async respondQuote(
    @CurrentUser() user: User,
    @Param('id') quoteId: string,
    @Body() dto: RespondQuoteDto,
  ) {
    return this.quotesService.respondQuote(user.id, quoteId, dto);
  }
}

