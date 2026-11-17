import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { VehicleType } from '@prisma/client';

export class RegisterTruckDto {
  @IsNotEmpty()
  @IsString()
  plate!: string;

  @IsNotEmpty()
  @IsEnum(VehicleType)
  type!: VehicleType;

  @IsNotEmpty()
  @IsString()
  make!: string;

  @IsNotEmpty()
  @IsString()
  model!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1995)
  @Max(2030)
  year!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(150)
  capacityTonnes!: number;

  @IsOptional()
  dimensionsJson?: Record<string, any>;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  photosJson?: Record<string, any>;
}

