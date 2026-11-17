import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestCallbackDto {
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  voiceNoteKey?: string; // If customer recorded audio request
}

