import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

// Roles a user may self-select during signup. ADMIN must be granted by an admin.
const SELF_SIGNUP_ROLES = [Role.APPRENANT, Role.FORMATEUR] as const;

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(SELF_SIGNUP_ROLES)
  role?: Role;
}
