import { IsString, MinLength, MaxLength } from 'class-validator';
import { Match } from '../../auth/decorators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(50)
  newPassword: string;

  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmNewPassword: string;
}