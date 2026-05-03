import { IsIn } from 'class-validator';
import { Role } from '@prisma/client';

const ASSIGNABLE_ROLES = [Role.APPRENANT, Role.FORMATEUR] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class UpdateRoleDto {
  @IsIn(ASSIGNABLE_ROLES, { message: 'role must be APPRENANT or FORMATEUR' })
  role!: AssignableRole;
}
