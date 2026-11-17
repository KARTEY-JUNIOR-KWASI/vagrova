import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { InitializeDepositDto } from './dto/initialize-deposit.dto';
import {
  PaymentMethod,
  PaymentStatus,
  LedgerEntryType,
  InvoiceStatus,
  BookingStatus,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Initializes a deposit payment with strict idempotency protection.
   */
  async initializeDeposit(userId: string, dto: InitializeDepositDto) {
    // 1. Check idempotency: If payment already started/completed with this key, return it
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return {
        id: existing.id,
        status: existing.status,
        providerRef: existing.providerRef,
        amountMinorUnits: existing.amountMinorUnits.toString(),
        currency: existing.currency,
        message: 'Payment previously initialized with this idempotency key.',
      };
    }

    // 2. Lookup Job & required deposit + verify ownership
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        quote: true,
        jobRequest: {
          include: { customer: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.jobRequest.customer.userId !== userId) {
      throw new ForbiddenException('You are not authorized to pay for this job.');
    }

    const requiredDepositMinor = job.quote.depositMinorUnits;
    const providerRef = `VG-DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        jobId: job.id,
        amountMinorUnits: requiredDepositMinor,
        currency: job.quote.currency,
        method: dto.method,
        providerRef,
        idempotencyKey: dto.idempotencyKey,
        status: PaymentStatus.PROCESSING,
      },
    });

    this.logger.log(
      `[PAYMENT-INIT] Initialized deposit of ${job.quote.currency} ${(Number(requiredDepositMinor) / 100).toFixed(2)} for ${job.jobNumber} via ${dto.method}`
    );

    await this.auditService.log({
      actorId: userId,
      action: 'PAYMENT_DEPOSIT_INITIALIZED',
      entityName: 'Payment',
      entityId: payment.id,
      afterState: {
        providerRef,
        amount: requiredDepositMinor.toString(),
        method: dto.method,
      },
    });

    // In production, invoke Paystack / Hubtel Mobile Money checkout prompt
    return {
      paymentId: payment.id,
      providerRef,
      amountMinorUnits: requiredDepositMinor.toString(),
      currency: job.quote.currency,
      checkoutUrl: `https://pay.vagrova.com/checkout/${providerRef}`,
      instructions:
        dto.method === PaymentMethod.MOBILE_MONEY
          ? `A Mobile Money prompt has been sent to ${dto.momoPhoneNumber || 'your phone'}. Please enter your PIN to authorize.`
          : 'Please complete payment and keep your reference note.',
    };
  }

  /**
   * Initializes payment against an issued Pro Forma Invoice (full or partial deposit/instalment).
   */
  async initializeInvoicePayment(
    userId: string,
    dto: {
      invoiceId: string;
      method: PaymentMethod;
      idempotencyKey: string;
      amountMinorUnits?: string | number;
    },
  ) {
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return {
        id: existing.id,
        status: existing.status,
        providerRef: existing.providerRef,
        amountMinorUnits: existing.amountMinorUnits.toString(),
        currency: existing.currency,
      };
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        quote: {
          include: {
            jobRequest: { include: { customer: true } },
            job: true,
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.quote.jobRequest.customer.userId !== userId) {
      throw new ForbiddenException('Not authorized to pay this invoice');
    }
    if (!invoice.quote.job) {
      throw new BadRequestException('Accept the quotation before initiating invoice payment');
    }

    const amountMinor = dto.amountMinorUnits ? BigInt(dto.amountMinorUnits) : invoice.totalMinor;
    if (amountMinor <= 0n || amountMinor > invoice.totalMinor) {
      throw new BadRequestException('Invalid payment amount for invoice');
    }

    const providerRef = `VG-INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await this.prisma.payment.create({
      data: {
        jobId: invoice.quote.job.id,
        invoiceId: invoice.id,
        amountMinorUnits: amountMinor,
        currency: invoice.currency,
        method: dto.method,
        providerRef,
        idempotencyKey: dto.idempotencyKey,
        status: PaymentStatus.PROCESSING,
      },
    });

    await this.prisma.jobRequest.update({
      where: { id: invoice.quote.jobRequestId },
      data: { bookingStatus: BookingStatus.PAYMENT_PENDING },
    });

    return {
      paymentId: payment.id,
      invoiceNumber: invoice.invoiceNumber,
      providerRef,
      amountMinorUnits: amountMinor.toString(),
      currency: invoice.currency,
    };
  }

  /**
   * Verifies webhook HMAC signature from aggregator (Paystack / Hubtel).
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) {
      return false;
    }
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  /**
   * Processes verified payment confirmation in an atomic database transaction.
   * Creates double-entry financial ledger postings and flags job as confirmed.
   */
  async processPaymentConfirmation(providerRef: string, externalTransactionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerRef },
      include: { job: true },
    });

    if (!payment) {
      throw new NotFoundException(`No payment found matching reference: ${providerRef}`);
    }

    if (payment.status === PaymentStatus.CONFIRMED) {
      this.logger.warn(`Duplicate webhook callback received for already confirmed payment: ${providerRef}`);
      return { success: true, message: 'Already processed' };
    }

    // ATOMIC DATABASE TRANSACTION
    await this.prisma.$transaction(async (tx) => {
      // 1. Mark payment CONFIRMED
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CONFIRMED,
        },
      });

      if (payment.invoiceId) {
        const inv = await tx.invoice.findUnique({
          where: { id: payment.invoiceId },
          include: { quote: true },
        });
        if (inv) {
          const confirmedPayments = await tx.payment.findMany({
            where: { invoiceId: inv.id, status: PaymentStatus.CONFIRMED },
          });
          const paidSum = confirmedPayments.reduce((acc, p) => acc + p.amountMinorUnits, 0n);
          const fullyPaid = paidSum >= inv.totalMinor;
          if (fullyPaid) {
            await tx.invoice.update({ where: { id: inv.id }, data: { status: InvoiceStatus.PAID } });
            await tx.jobRequest.update({
              where: { id: inv.quote.jobRequestId },
              data: { bookingStatus: BookingStatus.PAID },
            });
          }
        }
      }

      // 2. Double-entry financial posting
      // DEBIT: Gateway clearing account (Assets)
      await tx.ledgerEntry.create({
        data: {
          accountCode: '1010-PAYMENT-GATEWAY-RECEIVABLE',
          entryType: LedgerEntryType.DEBIT,
          amountMinorUnits: payment.amountMinorUnits,
          currency: payment.currency,
          paymentId: payment.id,
          description: `Deposit payment received for Job ${payment.job.jobNumber}`,
        },
      });

      // CREDIT: Customer deposits escrow account (Liabilities)
      await tx.ledgerEntry.create({
        data: {
          accountCode: '2020-CUSTOMER-DEPOSITS-ESCROW',
          entryType: LedgerEntryType.CREDIT,
          amountMinorUnits: payment.amountMinorUnits,
          currency: payment.currency,
          paymentId: payment.id,
          description: `Customer deposit liability held for Job ${payment.job.jobNumber}`,
        },
      });

      // 3. Update Job status
      await tx.job.update({
        where: { id: payment.jobId },
        data: {
          bookedAt: new Date(),
        },
      });
    });

    this.logger.log(`[PAYMENT-CONFIRMED] Job ${payment.job.jobNumber} deposit confirmed. Double-entry ledger posted.`);

    await this.auditService.log({
      action: 'PAYMENT_DEPOSIT_CONFIRMED_LEDGER_POSTED',
      entityName: 'Payment',
      entityId: payment.id,
      afterState: {
        providerRef,
        externalTransactionId,
        amount: payment.amountMinorUnits.toString(),
      },
    });

    return { success: true };
  }
}

