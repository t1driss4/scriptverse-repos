import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @IsOptional()
  @IsIn(SELF_SIGNUP_ROLES)
  role?: Role;
}
