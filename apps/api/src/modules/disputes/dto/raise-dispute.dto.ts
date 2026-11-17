import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RaiseDisputeDto {
  @IsNotEmpty()
  @IsString()
  jobId!: string;

  @IsNotEmpty()
  @IsString()
  reason!: string; // E.g. 'Cargo damaged during offloading', 'Unreasonable driver delay > 3 hrs', 'Road access denied'

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsArray()
  evidencePhotoKeys?: string[];
}

