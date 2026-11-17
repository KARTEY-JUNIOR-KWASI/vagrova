import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum DisputeResolutionAction {
  RELEASE_FULL_PAYOUT = 'RELEASE_FULL_PAYOUT',
  PARTIAL_PAYOUT_DEDUCTION = 'PARTIAL_PAYOUT_DEDUCTION',
  FULL_REFUND_CUSTOMER = 'FULL_REFUND_CUSTOMER',
}

export class ResolveDisputeDto {
  @IsNotEmpty()
  @IsEnum(DisputeResolutionAction)
  action!: DisputeResolutionAction;

  @IsNotEmpty()
  @IsString()
  resolutionNotes!: string;

  @IsOptional()
  @IsString()
  adjustedPayoutMinorUnits?: string; // If partial deduction applied
}

