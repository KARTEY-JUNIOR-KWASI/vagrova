import { Module } from '@nestjs/common';
import { CallCenterService } from './call-center.service';
import { CallCenterController } from './call-center.controller';
import { QuotesModule } from '@/modules/quotes/quotes.module';

@Module({
  imports: [QuotesModule],
  controllers: [CallCenterController],
  providers: [CallCenterService],
  exports: [CallCenterService],
})
export class CallCenterModule {}

