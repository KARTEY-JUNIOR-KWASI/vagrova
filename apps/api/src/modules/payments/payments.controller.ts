import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitializeDepositDto } from './dto/initialize-deposit.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole, PaymentMethod } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async listAdminPayments() {
    return this.paymentsService.listAdminPayments();
  }

  @Post('deposits/initialize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initializeDeposit(
    @CurrentUser() user: User,
    @Body() dto: InitializeDepositDto,
  ) {
    return this.paymentsService.initializeDeposit(user.id, dto);
  }

  @Post('invoices/initialize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initializeInvoicePayment(
    @CurrentUser() user: User,
    @Body()
    body: {
      invoiceId: string;
      method: PaymentMethod;
      idempotencyKey: string;
      amountMinorUnits?: string | number;
    },
  ) {
    return this.paymentsService.initializeInvoicePayment(user.id, body);
  }

  @Post('webhooks/provider-callback')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
  ) {
    if (!signature || !req.rawBody) {
      throw new UnauthorizedException('Missing webhook signature or raw request body');
    }

    if (!this.paymentsService.verifyWebhookSignature(req.rawBody, signature)) {
      throw new UnauthorizedException('Invalid payment webhook signature');
    }

    const providerRef = payload?.data?.reference || payload?.reference;
    const transactionId = String(payload?.data?.id || payload?.id || 'PROVIDER_TXN');

    if (!providerRef) {
      throw new BadRequestException('Missing payment reference in webhook payload');
    }

    return this.paymentsService.processPaymentConfirmation(providerRef, transactionId);
  }

  @Post('admin/manual-confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async manualConfirmPayment(
    @CurrentUser() user: User,
    @Body() body: { providerRef: string; notes?: string },
  ) {
    return this.paymentsService.processPaymentConfirmation(
      body.providerRef,
      `MANUAL_ADMIN_${user.id}`
    );
  }
}

