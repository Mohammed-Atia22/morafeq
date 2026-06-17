import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RefundPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountCents?: number; // partial refund — if not provided full refund

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}