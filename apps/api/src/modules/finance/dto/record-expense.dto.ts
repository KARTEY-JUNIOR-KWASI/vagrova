import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecordExpenseDto {
  @IsNotEmpty()
  @IsString()
  category!: 'FUEL' | 'OFFICE' | 'TRANSIT_PERMITS' | 'EQUIPMENT_MAINTENANCE' | 'TELECOM' | 'OTHER';

  @IsNotEmpty()
  @IsString()
  amountMinorUnits!: string; // Stored in Pesewas (e.g. GHS 450.00 = "45000")

  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  receiptKey?: string; // Reference to uploaded receipt scan in storage
}

