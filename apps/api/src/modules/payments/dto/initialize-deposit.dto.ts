import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class InitializeDepositDto {
  @IsNotEmpty()
  @IsString()
  jobId!: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  momoProvider?: 'MTN' | 'TELECEL' | 'AIRTELTIGO';

  @IsOptional()
  @IsString()
  momoPhoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  idempotencyKey!: string; // Client-generated UUID to strictly prevent duplicate charges
}

