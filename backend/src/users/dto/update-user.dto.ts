import { IsOptional, IsString, MinLength } from 'class-validator';

// Deliberately narrow: only fields a user may change about themselves.
// Role and phone are not editable here, changing either is an admin
// concern this MVP does not need, see docs/conventions.md on keeping
// DTOs scoped to exactly what the endpoint allows.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
