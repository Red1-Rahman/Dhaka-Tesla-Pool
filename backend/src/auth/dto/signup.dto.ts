import { IsEnum, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// Validated at the controller boundary before AuthService ever sees it,
// see docs/conventions.md: controllers validate and delegate, services
// hold the logic.
export class SignupDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsPhoneNumber('BD')
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;
}
