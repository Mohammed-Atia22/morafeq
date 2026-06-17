import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectListingDto {
  @IsString()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  @MaxLength(500)
  reason!: string; // required — host must know why
}