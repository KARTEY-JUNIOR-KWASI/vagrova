import { IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

const SELF_REGISTER_ROLES = ['CUSTOMER', 'OWNER', 'DRIVER'] as const;

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(SELF_REGISTER_ROLES, {
    message: 'Self-registration role must be CUSTOMER, OWNER, or DRIVER',
  })
  role?: 'CUSTOMER' | 'OWNER' | 'DRIVER';
}

