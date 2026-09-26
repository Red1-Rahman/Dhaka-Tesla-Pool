import { IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class SigninDto {
  @IsPhoneNumber('BD')
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;
}
