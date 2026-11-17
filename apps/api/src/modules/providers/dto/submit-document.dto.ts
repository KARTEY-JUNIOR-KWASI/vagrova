import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class SubmitDocumentDto {
  @IsNotEmpty()
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsNotEmpty()
  @IsString()
  fileKey!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  truckId?: string; // If document pertains to a vehicle (roadworthy, registration, insurance)
}

