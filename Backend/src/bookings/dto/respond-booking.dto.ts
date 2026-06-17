import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum BookingResponseAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export class RespondBookingDto {
  @IsEnum(BookingResponseAction)
  action!: BookingResponseAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string; // host note or rejection reason
}