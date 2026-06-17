import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  listingId!: number;

  @IsOptional()
  @IsDateString()
  preferredMoveInDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  guestMessage?: string;
}