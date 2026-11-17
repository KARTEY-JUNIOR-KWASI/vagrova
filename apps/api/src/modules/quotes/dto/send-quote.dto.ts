import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SendQuoteDto {
  @IsNotEmpty()
  totalMinorUnits!: string; // Pesewas as string for exact precision (e.g. "685000")

  @IsNotEmpty()
  depositMinorUnits!: string; // Pesewas as string (e.g. "342500")

  @IsNotEmpty()
  @IsArray()
  breakdown!: Array<{ code: string; name: string; amountMinorUnits: string }>;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityHours?: number; // Default 48 hours

  @IsOptional()
  @IsString()
  notes?: string;
}

