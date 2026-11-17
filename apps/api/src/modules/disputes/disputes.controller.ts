import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('raise')
  @HttpCode(HttpStatus.OK)
  async raiseDispute(
    @CurrentUser() user: User,
    @Body() dto: RaiseDisputeDto,
  ) {
    return this.disputesService.raiseDispute(user.id, dto);
  }

  @Get('admin/queue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async listDisputedJobs() {
    return this.disputesService.listDisputedJobs();
  }

  @Post('admin/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(user.id, jobId, dto);
  }
}

