import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum OfferResponseAction {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
}

export class RespondOfferDto {
  @IsNotEmpty()
  @IsEnum(OfferResponseAction)
  action!: OfferResponseAction;

  @IsOptional()
  @IsString()
  declineReason?: string; // E.g. 'Truck currently loaded', 'Distance too far', etc.
}

