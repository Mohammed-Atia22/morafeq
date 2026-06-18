import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReleasePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
