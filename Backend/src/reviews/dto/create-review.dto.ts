import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ReviewType } from '@prisma/client';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookingId: number;

  @IsEnum(ReviewType)
  type: ReviewType;

  // التقييم العام: من نجمة واحدة إلى 5 نجوم
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  // الحقول التالية مطلوبة فقط عند تقييم السكن
  @ValidateIf(
    (dto: CreateReviewDto) =>
      dto.type === ReviewType.GUEST_TO_LISTING,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  cleanliness?: number;

  @ValidateIf(
    (dto: CreateReviewDto) =>
      dto.type === ReviewType.GUEST_TO_LISTING,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  location?: number;

  @ValidateIf(
    (dto: CreateReviewDto) =>
      dto.type === ReviewType.GUEST_TO_LISTING,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  accuracy?: number;

  @ValidateIf(
    (dto: CreateReviewDto) =>
      dto.type === ReviewType.GUEST_TO_LISTING,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  value?: number;

  // الرأي المكتوب مع التقييم
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}