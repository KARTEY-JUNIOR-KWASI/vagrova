import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CallCenterModule } from './modules/call-center/call-center.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { FinanceModule } from './modules/finance/finance.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuditModule,
    StorageModule,
    AuthModule,
    ProvidersModule,
    DocumentsModule,
    PricingModule,
    QuotesModule,
    PaymentsModule,
    CallCenterModule,
    DispatchModule,
    TrackingModule,
    NotificationsModule,
    DisputesModule,
    RatingsModule,
    ReceiptsModule,
    FinanceModule,
    EquipmentModule,
    InvoicesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

