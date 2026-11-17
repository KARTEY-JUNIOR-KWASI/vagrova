import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VehicleType } from '@prisma/client';

export class BookOnBehalfDto {
  @IsNotEmpty()
  @IsString()
  customerPhone!: string;

  @IsNotEmpty()
  @IsString()
  customerName!: string;

  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsNotEmpty()
  @IsString()
  pickupAddress!: string;

  @IsOptional()
  @IsString()
  pickupLandmark?: string;

  @IsNotEmpty()
  @IsString()
  deliveryAddress!: string;

  @IsOptional()
  @IsString()
  deliveryLandmark?: string;

  @IsNotEmpty()
  @IsString()
  cargoDescription!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  weightTonnes!: number;

  @IsOptional()
  @IsString()
  voiceNoteKey?: string;

  @IsOptional()
  @IsString()
  callNotes?: string;
}

