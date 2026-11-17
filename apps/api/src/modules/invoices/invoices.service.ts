import { Injectable, NotFoundException, ForbiddenException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { StorageService } from '@/modules/storage/storage.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { BookingStatus, InvoiceKind, InvoiceStatus, User, UserRole } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

const STAFF_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.BOOKING_OFFICER,
  UserRole.SALES_OFFICER,
  UserRole.FINANCE,
  UserRole.OPERATIONS_MANAGER,
];

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  private serializeInvoice(inv: any) {
    return {
      ...inv,
      subtotalMinor: inv.subtotalMinor.toString(),
      taxMinor: inv.taxMinor.toString(),
      totalMinor: inv.totalMinor.toString(),
    };
  }

  private async generateInvoiceNumber(kind: InvoiceKind): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { kind } });
    const prefix = kind === InvoiceKind.PRO_FORMA ? 'VGI-PF' : kind === InvoiceKind.TAX_INVOICE ? 'VGI-TX' : 'VGI-RC';
    return `${prefix}-${String(1000 + count + 1).padStart(6, '0')}`;
  }

  private buildPdfBuffer(params: {
    invoiceNumber: string;
    kind: InvoiceKind;
    customerName: string;
    customerPhone: string;
    jobNumber: string;
    equipmentName: string;
    serviceDescription: string;
    locationSummary: string;
    subtotalGhs: string;
    taxGhs: string;
    totalGhs: string;
    issuedDate: string;
    expiresDate: string;
    notes?: string | null;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header Banner
      doc.rect(0, 0, doc.page.width, 96).fill('#0D6D78');
      doc.fillColor('#FFC600').fontSize(22).font('Helvetica-Bold').text('VAGROVA', 48, 28);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text('HEAVY-DUTY LOGISTICS & MACHINERY RENTALS · GHANA', 48, 56);

      doc.fillColor('#FFC600').fontSize(13).font('Helvetica-Bold').text(
        params.kind === InvoiceKind.PRO_FORMA ? 'PRO FORMA INVOICE' : 'TAX INVOICE',
        340,
        30,
        { align: 'right', width: 205 },
      );
      doc.fillColor('#EBF2F3').fontSize(10).font('Helvetica').text(params.invoiceNumber, 340, 50, { align: 'right', width: 205 });

      // Notice distinguishing Pro Forma from Receipt/Tax Invoice
      doc.moveDown(3);
      doc.fillColor('#0D6D78').fontSize(9).font('Helvetica-Bold').text(
        'NOTICE: This is a Pro Forma Invoice for booking payment — NOT a payment receipt or final tax invoice.',
        48,
        112,
      );

      // Customer & Booking Info
      doc.fillColor('#1F2326').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 48, 142);
      doc.font('Helvetica').text(params.customerName, 48, 158);
      doc.text(params.customerPhone, 48, 173);

      doc.font('Helvetica-Bold').text('BOOKING DETAILS:', 320, 142);
      doc.font('Helvetica').text(`Booking Ref: ${params.jobNumber}`, 320, 158);
      doc.text(`Issued: ${params.issuedDate}`, 320, 173);
      doc.text(`Valid Until: ${params.expiresDate}`, 320, 188);

      // Line Item Table Header
      doc.rect(48, 224, 499, 26).fill('#EBF2F3');
      doc.fillColor('#0D6D78').fontSize(10).font('Helvetica-Bold');
      doc.text('EQUIPMENT / SERVICE DESCRIPTION', 58, 232);
      doc.text('AMOUNT (GHS)', 420, 232, { align: 'right', width: 115 });

      // Line Item Row
      doc.fillColor('#1F2326').font('Helvetica-Bold').fontSize(11).text(params.equipmentName, 58, 264);
      doc.font('Helvetica').fontSize(10).text(params.serviceDescription, 58, 282, { width: 340 });
      doc.text(`Location: ${params.locationSummary}`, 58, 314, { width: 340 });
      doc.font('Helvetica-Bold').fontSize(11).text(params.subtotalGhs, 420, 264, { align: 'right', width: 115 });

      // Totals
      doc.moveTo(48, 355).lineTo(547, 355).strokeColor('#CFE0E3').stroke();
      doc.font('Helvetica').fontSize(10).text('Subtotal:', 340, 370);
      doc.text(`GHS ${params.subtotalGhs}`, 420, 370, { align: 'right', width: 115 });
      doc.text('Levies / Tax:', 340, 388);
      doc.text(`GHS ${params.taxGhs}`, 420, 388, { align: 'right', width: 115 });

      doc.rect(330, 410, 217, 32).fill('#0D6D78');
      doc.fillColor('#FFC600').font('Helvetica-Bold').fontSize(12).text('TOTAL DUE:', 342, 420);
      doc.fillColor('#FFFFFF').text(`GHS ${params.totalGhs}`, 420, 420, { align: 'right', width: 115 });

      // Terms
      doc.fillColor('#4B6B70').font('Helvetica-Bold').fontSize(9).text('TERMS & PAYMENT INSTRUCTIONS', 48, 475);
      doc.font('Helvetica').fontSize(9).text(
        params.notes ||
          '1. Equipment dispatch is scheduled after payment verification.\n2. Accepted methods: MTN MoMo, Telecel Cash, AT Money, Bank Transfer, or Card.\n3. Quote & Pro Forma rates expire on the Valid Until date shown above.',
        48,
        492,
        { width: 499 },
      );

      doc.end();
    });
  }

  async generateProFormaInvoice(staffId: string, quoteId: string, notes?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        jobRequest: {
          include: {
            customer: { include: { user: true } },
            equipmentType: true,
            projectDetail: true,
          },
        },
        job: true,
      },
    });

    if (!quote) throw new NotFoundException('Quotation not found');

    const existingCount = await this.prisma.invoice.count({
      where: { quoteId: quote.id, kind: InvoiceKind.PRO_FORMA },
    });

    // Mark previous pro forma invoices for this quote as REVISED
    if (existingCount > 0) {
      await this.prisma.invoice.updateMany({
        where: { quoteId: quote.id, kind: InvoiceKind.PRO_FORMA, status: InvoiceStatus.ISSUED },
        data: { status: InvoiceStatus.REVISED },
      });
    }

    const invoiceNumber = await this.generateInvoiceNumber(InvoiceKind.PRO_FORMA);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const subtotalMinor = quote.totalMinorUnits;
    const taxMinor = 0n;
    const totalMinor = subtotalMinor + taxMinor;

    const req = quote.jobRequest;
    const equipmentName = req.equipmentType?.name || req.vehicleType;
    const locationSummary = req.projectDetail
      ? req.projectDetail.projectLocation
      : `${req.pickupAddress} -> ${req.deliveryAddress}`;

    const pdfBuffer = await this.buildPdfBuffer({
      invoiceNumber,
      kind: InvoiceKind.PRO_FORMA,
      customerName: req.customer.user.name,
      customerPhone: req.customer.user.phone,
      jobNumber: req.jobNumber,
      equipmentName,
      serviceDescription: req.description,
      locationSummary,
      subtotalGhs: (Number(subtotalMinor) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      taxGhs: (Number(taxMinor) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      totalGhs: (Number(totalMinor) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      issuedDate: new Date().toISOString().slice(0, 10),
      expiresDate: expiresAt.toISOString().slice(0, 10),
      notes,
    });

    const pdfKey = await this.storageService.uploadFile(
      { buffer: pdfBuffer, filename: `${invoiceNumber}.pdf`, mimetype: 'application/pdf' },
      'invoices',
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        kind: InvoiceKind.PRO_FORMA,
        quoteId: quote.id,
        jobId: quote.job?.id || null,
        status: InvoiceStatus.ISSUED,
        revisionNumber: existingCount + 1,
        subtotalMinor,
        taxMinor,
        totalMinor,
        expiresAt,
        pdfKey,
        notes: notes || null,
        issuedById: staffId,
      },
    });

    await this.prisma.jobRequest.update({
      where: { id: req.id },
      data: { bookingStatus: BookingStatus.INVOICED },
    });

    if (this.notificationsService) {
      await this.notificationsService.sendSms(
        req.customer.user.phone,
        `Vagrova: Pro Forma Invoice ${invoiceNumber} for ${req.jobNumber} (GHS ${(Number(totalMinor) / 100).toFixed(2)}) is ready in your app.`,
      );
    }

    await this.auditService.log({
      actorId: staffId,
      action: 'PRO_FORMA_INVOICE_ISSUED',
      entityName: 'Invoice',
      entityId: invoice.id,
      afterState: { invoiceNumber, quoteId: quote.id, totalMinor: totalMinor.toString() },
    });

    return {
      ...this.serializeInvoice(invoice),
      pdfUrl: `/api/v1/invoices/${invoice.id}/pdf`,
    };
  }

  async listMyInvoices(userId: string) {
    const rows = await this.prisma.invoice.findMany({
      where: { quote: { jobRequest: { customer: { userId } } } },
      include: { quote: { include: { jobRequest: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      ...this.serializeInvoice(r),
      pdfUrl: `/api/v1/invoices/${r.id}/pdf`,
    }));
  }

  async listAdminInvoices() {
    const rows = await this.prisma.invoice.findMany({
      include: {
        quote: { include: { jobRequest: { include: { customer: { include: { user: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      ...this.serializeInvoice(r),
      pdfUrl: `/api/v1/invoices/${r.id}/pdf`,
    }));
  }

  async getInvoicePdfFile(user: User, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { quote: { include: { jobRequest: { include: { customer: true } } } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const isOwner = invoice.quote.jobRequest.customer.userId === user.id;
    const isStaff = STAFF_ROLES.includes(user.role);
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Not authorized to access this invoice');
    }

    if (!invoice.pdfKey) throw new NotFoundException('PDF file not generated');
    const fullPath = path.resolve(this.uploadDir, invoice.pdfKey);
    if (!fullPath.startsWith(this.uploadDir) || !fs.existsSync(fullPath)) {
      throw new NotFoundException('PDF file missing on storage');
    }

    return {
      invoiceNumber: invoice.invoiceNumber,
      fullPath,
    };
  }
}
