import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ProcessPayoutDto {
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payoutMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  recipientMomoNumber?: string;

  @IsOptional()
  @IsString()
  recipientBankAccount?: string;

  @IsOptional()
  @IsString()
  settlementNotes?: string;
}

