import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum QuoteResponseAction {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
}

export class RespondQuoteDto {
  @IsNotEmpty()
  @IsEnum(QuoteResponseAction)
  action!: QuoteResponseAction;

  @IsOptional()
  @IsString()
  declineReason?: string;
}

