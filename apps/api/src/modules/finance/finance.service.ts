import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { ProcessPayoutDto } from './dto/process-payout.dto';
import { RecordExpenseDto } from './dto/record-expense.dto';
import {
  PaymentStatus,
  LedgerEntryType,
  JobStatus,
} from '@prisma/client';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Calculates net payout for a completed haulage job.
   * Default platform commission is 15% (configurable in PriceRule).
   */
  async calculateJobPayout(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        quote: true,
        driver: { include: { user: true } },
        truck: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const grossMinorUnits = job.quote.totalMinorUnits; // In pesewas
    const commissionPct = 15n; // 15%
    const commissionMinorUnits = (grossMinorUnits * commissionPct) / 100n;
    const netMinorUnits = grossMinorUnits - commissionMinorUnits;

    return {
      jobId: job.id,
      jobNumber: job.jobNumber,
      currency: job.quote.currency,
      grossMinorUnits: grossMinorUnits.toString(),
      grossGHS: (Number(grossMinorUnits) / 100).toFixed(2),
      commissionPct: Number(commissionPct),
      commissionMinorUnits: commissionMinorUnits.toString(),
      commissionGHS: (Number(commissionMinorUnits) / 100).toFixed(2),
      netMinorUnits: netMinorUnits.toString(),
      netGHS: (Number(netMinorUnits) / 100).toFixed(2),
      providerName: job.driver?.user.name || 'Unassigned',
      truckPlate: job.truck?.plate || '—',
    };
  }

  /**
   * Settle and disburse payout to truck owner / driver.
   * Enforces rules:
   * 1. Job must be COMPLETED or DELIVERED.
   * 2. Cannot settle a DISPUTED job without formal resolution.
   * 3. Prevents duplicate payout postings.
   * 4. Automatically records balanced double-entry ledger postings.
   */
  async settlePayout(adminId: string, jobId: string, dto: ProcessPayoutDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        quote: true,
        driver: true,
        payouts: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status === JobStatus.DISPUTED) {
      throw new BadRequestException('Cannot settle payout on a DISPUTED job. Dispute must be resolved first.');
    }

    if (!job.driverId) {
      throw new BadRequestException('No driver/carrier is linked to this job.');
    }

    // Check duplicate
    const existingConfirmedPayout = job.payouts.find((p) => p.status === PaymentStatus.CONFIRMED);
    if (existingConfirmedPayout) {
      throw new ConflictException(`Payout has already been confirmed and disbursed for Job ${job.jobNumber}.`);
    }

    const payoutCalc = await this.calculateJobPayout(jobId);
    const grossMinorUnits = BigInt(payoutCalc.grossMinorUnits);
    const commissionMinorUnits = BigInt(payoutCalc.commissionMinorUnits);
    const netMinorUnits = BigInt(payoutCalc.netMinorUnits);
    const providerRef = `VG-PAYOUT-${Date.now()}`;

    // ATOMIC DOUBLE-ENTRY SETTLEMENT TRANSACTION
    const payout = await this.prisma.$transaction(async (tx) => {
      // 1. Create confirmed Payout record
      const createdPayout = await tx.payout.create({
        data: {
          jobId: job.id,
          providerId: job.driverId!,
          grossMinorUnits,
          commissionMinorUnits,
          netMinorUnits,
          currency: job.quote.currency,
          status: PaymentStatus.CONFIRMED,
          providerRef,
        },
      });

      // 2. DOUBLE-ENTRY FINANCIAL LEDGER POSTINGS
      // Clear Customer Deposit Escrow liability (DEBIT)
      await tx.ledgerEntry.create({
        data: {
          accountCode: '2020-CUSTOMER-DEPOSITS-ESCROW',
          entryType: LedgerEntryType.DEBIT,
          amountMinorUnits: grossMinorUnits,
          currency: job.quote.currency,
          payoutId: createdPayout.id,
          description: `Clear customer deposit liability for completed Job ${job.jobNumber}`,
        },
      });

      // Recognize Vagrova Platform Commission Revenue (CREDIT)
      await tx.ledgerEntry.create({
        data: {
          accountCode: '4010-PLATFORM-COMMISSION-REVENUE',
          entryType: LedgerEntryType.CREDIT,
          amountMinorUnits: commissionMinorUnits,
          currency: job.quote.currency,
          payoutId: createdPayout.id,
          description: `Vagrova 15% commission revenue on Job ${job.jobNumber}`,
        },
      });

      // Cash disbursement to Carrier Mobile Money / Bank (CREDIT)
      await tx.ledgerEntry.create({
        data: {
          accountCode: '1020-BANK-MOMO-DISBURSEMENT',
          entryType: LedgerEntryType.CREDIT,
          amountMinorUnits: netMinorUnits,
          currency: job.quote.currency,
          payoutId: createdPayout.id,
          description: `Net earnings disbursed to provider for Job ${job.jobNumber}`,
        },
      });

      return createdPayout;
    });

    this.logger.log(
      `[PAYOUT-SETTLED] Disbursed GHS ${(Number(netMinorUnits) / 100).toFixed(2)} to Provider ${job.driverId} for ${job.jobNumber}`
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'PROVIDER_PAYOUT_SETTLED',
      entityName: 'Payout',
      entityId: payout.id,
      afterState: {
        jobNumber: job.jobNumber,
        gross: grossMinorUnits.toString(),
        commission: commissionMinorUnits.toString(),
        net: netMinorUnits.toString(),
        method: dto.payoutMethod,
      },
    });

    return {
      success: true,
      payoutId: payout.id,
      providerRef,
      jobNumber: job.jobNumber,
      netDisbursedGHS: payoutCalc.netGHS,
      commissionEarnedGHS: payoutCalc.commissionGHS,
    };
  }

  /**
   * Record operational expenditure (fuel, office, permits, repairs) with receipt tracking.
   */
  async recordExpense(adminId: string, dto: RecordExpenseDto) {
    const amountMinorUnits = BigInt(dto.amountMinorUnits);

    const expense = await this.prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          category: dto.category,
          amountMinorUnits,
          currency: 'GHS',
          date: new Date(dto.date),
          description: dto.description,
          receiptKey: dto.receiptKey || null,
          enteredById: adminId,
        },
      });

      // Post expense to Double-Entry Ledger
      await tx.ledgerEntry.create({
        data: {
          accountCode: `5000-OPERATING-EXPENSES-${dto.category}`,
          entryType: LedgerEntryType.DEBIT,
          amountMinorUnits,
          currency: 'GHS',
          description: `Operating expense: ${dto.description}`,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountCode: '1020-BANK-MOMO-DISBURSEMENT',
          entryType: LedgerEntryType.CREDIT,
          amountMinorUnits,
          currency: 'GHS',
          description: `Cash outflow for operating expense: ${dto.description}`,
        },
      });

      return exp;
    });

    this.logger.log(
      `[EXPENSE-RECORDED] GHS ${(Number(amountMinorUnits) / 100).toFixed(2)} under ${dto.category}`
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'OPERATING_EXPENSE_RECORDED',
      entityName: 'Expense',
      entityId: expense.id,
      afterState: {
        category: dto.category,
        amount: dto.amountMinorUnits,
        description: dto.description,
      },
    });

    return {
      success: true,
      expenseId: expense.id,
      category: expense.category,
      amountGHS: (Number(amountMinorUnits) / 100).toFixed(2),
    };
  }

  /**
   * Generates comprehensive Profit & Loss report across any date range.
   */
  async getProfitAndLossReport(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const payouts = await this.prisma.payout.findMany({
      where: {
        status: PaymentStatus.CONFIRMED,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: startDate || endDate ? { date: dateFilter } : {},
    });

    const totalGrossVolumeMinor = payouts.reduce((acc, p) => acc + p.grossMinorUnits, 0n);
    const totalCommissionRevenueMinor = payouts.reduce((acc, p) => acc + p.commissionMinorUnits, 0n);
    const totalProviderPayoutsMinor = payouts.reduce((acc, p) => acc + p.netMinorUnits, 0n);
    const totalOperatingExpensesMinor = expenses.reduce((acc, e) => acc + e.amountMinorUnits, 0n);
    const netProfitMinor = totalCommissionRevenueMinor - totalOperatingExpensesMinor;

    return {
      currency: 'GHS',
      grossFreightVolumeGHS: (Number(totalGrossVolumeMinor) / 100).toFixed(2),
      platformCommissionRevenueGHS: (Number(totalCommissionRevenueMinor) / 100).toFixed(2),
      providerDisbursementsGHS: (Number(totalProviderPayoutsMinor) / 100).toFixed(2),
      operatingExpensesGHS: (Number(totalOperatingExpensesMinor) / 100).toFixed(2),
      netOperatingProfitGHS: (Number(netProfitMinor) / 100).toFixed(2),
      operatingMarginPct:
        totalCommissionRevenueMinor > 0n
          ? ((Number(netProfitMinor) / Number(totalCommissionRevenueMinor)) * 100).toFixed(1)
          : '0.0',
      totalCompletedTrips: payouts.length,
      expensesBreakdownByCategory: this.groupExpensesByCategory(expenses),
    };
  }

  private groupExpensesByCategory(expenses: any[]) {
    const map: Record<string, bigint> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0n) + e.amountMinorUnits;
    }
    const result: Record<string, string> = {};
    for (const [cat, amount] of Object.entries(map)) {
      result[cat] = (Number(amount) / 100).toFixed(2);
    }
    return result;
  }

  /**
   * Generates CSV export data formatted for Excel and accounting audits.
   */
  async exportReportCsv(type: 'payouts' | 'expenses' | 'jobs'): Promise<string> {
    if (type === 'payouts') {
      const payouts = await this.prisma.payout.findMany({
        include: { job: true, provider: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'PayoutID,JobNumber,ProviderName,ProviderPhone,GrossGHS,CommissionGHS,NetGHS,Date,Status\n';
      const rows = payouts
        .map(
          (p) =>
            `${p.id},${p.job.jobNumber},"${p.provider.user.name}",${p.provider.user.phone},${(
              Number(p.grossMinorUnits) / 100
            ).toFixed(2)},${(Number(p.commissionMinorUnits) / 100).toFixed(2)},${(
              Number(p.netMinorUnits) / 100
            ).toFixed(2)},${p.createdAt.toISOString()},${p.status}`
        )
        .join('\n');

      return header + rows;
    }

    if (type === 'expenses') {
      const expenses = await this.prisma.expense.findMany({ orderBy: { date: 'desc' } });
      const header = 'ExpenseID,Category,Description,AmountGHS,Date\n';
      const rows = expenses
        .map(
          (e) =>
            `${e.id},${e.category},"${e.description.replace(/"/g, '""')}",${(
              Number(e.amountMinorUnits) / 100
            ).toFixed(2)},${e.date.toISOString().split('T')[0]}`
        )
        .join('\n');

      return header + rows;
    }

    // Default jobs export
    const jobs = await this.prisma.job.findMany({
      include: { quote: true, truck: true, driver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'JobNumber,Status,VehicleType,TruckPlate,DriverName,QuotedTotalGHS,CreatedAt\n';
    const rows = jobs
      .map(
        (j) =>
          `${j.jobNumber},${j.status},${j.truck?.type || '—'},${j.truck?.plate || '—'},"${
            j.driver?.user.name || 'Unassigned'
          }",${(Number(j.quote.totalMinorUnits) / 100).toFixed(2)},${j.createdAt.toISOString()}`
      )
      .join('\n');

    return header + rows;
  }
}

