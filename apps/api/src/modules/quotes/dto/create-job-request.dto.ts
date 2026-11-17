import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ArrayMaxSize,
  IsObject,
} from 'class-validator';
import { VehicleType, ServiceCategoryGroup } from '@prisma/client';

export class CreateJobRequestDto {
  @IsOptional()
  @IsEnum(ServiceCategoryGroup)
  serviceGroup?: ServiceCategoryGroup;

  @IsOptional()
  @IsString()
  equipmentTypeId?: string;

  @IsOptional()
  @IsString()
  preferredAt?: string;

  @IsOptional()
  @IsObject()
  projectDetail?: {
    projectLocation: string;
    workDescription: string;
    startDate: string;
    expectedDuration: number;
    durationUnit?: string;
    workingCapacity?: string;
    siteAccessibility?: string;
    operatorRequired?: boolean;
    fuelArrangement?: string;
    transportNeeded?: boolean;
    specialInstructions?: string;
  };

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
  pickupContactName!: string;

  @IsNotEmpty()
  @IsString()
  pickupContactPhone!: string;

  @IsOptional()
  @IsNumber()
  pickupLatitude?: number;

  @IsOptional()
  @IsNumber()
  pickupLongitude?: number;

  @IsNotEmpty()
  @IsString()
  deliveryAddress!: string;

  @IsOptional()
  @IsString()
  deliveryLandmark?: string;

  @IsNotEmpty()
  @IsString()
  deliveryContactName!: string;

  @IsNotEmpty()
  @IsString()
  deliveryContactPhone!: string;

  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;

  @IsOptional()
  extraStopsJson?: Record<string, any>;

  @IsNotEmpty()
  @IsString()
  loadCategory!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  weightTonnes!: number;

  @IsOptional()
  @IsBoolean()
  isOversized?: boolean;

  @IsOptional()
  @IsString()
  dimensionsText?: string;

  @IsOptional()
  @IsBoolean()
  needLoadingHelp?: boolean;

  @IsOptional()
  @IsBoolean()
  needOffloadingHelp?: boolean;

  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  photoKeys?: string[];

  @IsOptional()
  @IsString()
  voiceNoteKey?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

