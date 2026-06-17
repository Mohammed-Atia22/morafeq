import { IsIn } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CompleteOnboardingDto {
  @IsIn([UserRole.GUEST, UserRole.HOST], {
    message: 'Role must be either GUEST or HOST',
  })
  role!: UserRole;
}