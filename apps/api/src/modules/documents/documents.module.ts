import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentExpiryCron } from './document-expiry.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [DocumentExpiryCron],
  exports: [DocumentExpiryCron],
})
export class DocumentsModule {}

