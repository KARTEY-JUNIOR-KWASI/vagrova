import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class ReviewDocumentDto {
  @IsNotEmpty()
  @IsEnum(DocumentStatus)
  status!: DocumentStatus; // APPROVED or REJECTED

  @IsOptional()
  @IsString()
  rejectionReason?: string; // Required when status is REJECTED
}

