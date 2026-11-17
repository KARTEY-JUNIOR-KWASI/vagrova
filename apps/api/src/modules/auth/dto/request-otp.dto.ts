import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+233|0)[235][0-9]{8}$/, {
    message: 'Please provide a valid Ghanaian phone number (e.g. 0244123456 or +233244123456)',
  })
  phone!: string;
}

