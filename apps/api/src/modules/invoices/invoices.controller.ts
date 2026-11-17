import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('my')
  async listMyInvoices(@CurrentUser() user: User) {
    return this.invoicesService.listMyInvoices(user.id);
  }

  @Get('admin/all')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  async listAdminInvoices() {
    return this.invoicesService.listAdminInvoices();
  }

  @Post('admin/quotes/:quoteId/pro-forma')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE,
    UserRole.BOOKING_OFFICER,
    UserRole.SALES_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  async generateProForma(
    @CurrentUser() user: User,
    @Param('quoteId') quoteId: string,
    @Body() body: { notes?: string },
  ) {
    return this.invoicesService.generateProFormaInvoice(user.id, quoteId, body?.notes);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: User,
    @Param('id') invoiceId: string,
    @Res() res: Response,
  ) {
    const file = await this.invoicesService.getInvoicePdfFile(user, invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.invoiceNumber}.pdf"`);
    return res.sendFile(file.fullPath);
  }
}
