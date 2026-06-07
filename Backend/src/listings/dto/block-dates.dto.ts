import { IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { BlockReason } from '@prisma/client';

export class BlockDatesDto {
  @IsArray()
  @IsDateString({}, { each: true })
  dates!: string[]; // ['2024-06-01', '2024-06-02']

  @IsOptional()
  @IsEnum(BlockReason)
  reason?: BlockReason;
}