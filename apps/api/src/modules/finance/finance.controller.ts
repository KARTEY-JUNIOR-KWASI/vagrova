import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FinanceService } from './finance.service';
import { ProcessPayoutDto } from './dto/process-payout.dto';
import { RecordExpenseDto } from './dto/record-expense.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('payouts/calculate/:jobId')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER)
  async calculateJobPayout(@Param('jobId') jobId: string) {
    return this.financeService.calculateJobPayout(jobId);
  }

  @Post('payouts/settle/:jobId')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async settlePayout(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
    @Body() dto: ProcessPayoutDto,
  ) {
    return this.financeService.settlePayout(user.id, jobId, dto);
  }

  @Post('expenses')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async recordExpense(
    @CurrentUser() user: User,
    @Body() dto: RecordExpenseDto,
  ) {
    return this.financeService.recordExpense(user.id, dto);
  }

  @Get('reports/pnl')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getProfitAndLoss(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getProfitAndLossReport(startDate, endDate);
  }

  @Get('reports/export-csv')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async exportReportCsv(
    @Query('type') type: 'payouts' | 'expenses' | 'jobs',
    @Res() res: Response,
  ) {
    const csvContent = await this.financeService.exportReportCsv(type || 'payouts');
    const filename = `vagrova_${type || 'report'}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  }
}

