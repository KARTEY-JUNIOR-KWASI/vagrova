import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { JobStatus } from '@prisma/client';

export class AdvanceTripStepDto {
  @IsNotEmpty()
  @IsEnum(JobStatus)
  nextStatus!: JobStatus;

  @IsOptional()
  @IsString()
  photoProofKey?: string; // Required when nextStatus is LOADED or DELIVERED

  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'Customer delivery confirmation code must be 4 digits' })
  deliveryCode?: string; // Required when nextStatus is DELIVERED

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

