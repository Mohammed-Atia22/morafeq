import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason!: string;
}
