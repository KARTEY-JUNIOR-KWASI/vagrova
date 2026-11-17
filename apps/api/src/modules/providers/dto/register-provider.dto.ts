import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProviderKind } from '@prisma/client';

export class RegisterProviderDto {
  @IsNotEmpty()
  @IsEnum(ProviderKind)
  kind!: ProviderKind;

  @IsNotEmpty()
  @IsString()
  homeTown!: string;

  @IsNotEmpty()
  @IsString()
  nextOfKinName!: string;

  @IsNotEmpty()
  @IsString()
  nextOfKinPhone!: string;
}

