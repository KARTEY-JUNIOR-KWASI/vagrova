import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class BroadcastOffersDto {
  @IsNotEmpty()
  @IsString()
  jobId!: string;

  @IsNotEmpty()
  @IsArray()
  truckIds!: string[]; // Shortlisted candidate trucks

  @IsOptional()
  @IsInt()
  @Min(30)
  countdownSeconds?: number; // Default 60 seconds
}

