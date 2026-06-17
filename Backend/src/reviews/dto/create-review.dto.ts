import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewType } from '@prisma/client';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  bookingId!: number;

  @IsEnum(ReviewType, { message: 'Type must be GUEST_TO_HOST or HOST_TO_GUEST' })
  type!: ReviewType;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating!: number;

  // sub-ratings — only for GUEST_TO_HOST
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  cleanliness?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  location?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  accuracy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}