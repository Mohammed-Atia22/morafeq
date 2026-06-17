import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsInt()
  bookingId!: number;
}