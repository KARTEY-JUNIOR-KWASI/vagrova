import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get('consignment/:id')
  async getConsignmentNoteReceipt(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
  ) {
    return this.receiptsService.getConsignmentNoteReceipt(user, jobId);
  }
}

