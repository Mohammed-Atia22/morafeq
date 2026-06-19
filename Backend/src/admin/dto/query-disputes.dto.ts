import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export enum AdminDisputeStatus {
  // نزاع مفتوح والأدمن لم يتخذ قرارًا
  DISPUTED = 'DISPUTED',

  // الأدمن قرر أن صاحب السكن معه حق
  // وفي انتظار قرار المغترب
  DISPUTE_RESOLVED_FOR_HOST = 'DISPUTE_RESOLVED_FOR_HOST',

  // المغترب ألغى بعد قرار الأدمن لصاحب السكن
  CANCELLED_AFTER_DISPUTE = 'CANCELLED_AFTER_DISPUTE',

  // تم حل النزاع لصالح المغترب وإرجاع المبلغ
  REFUNDED = 'REFUNDED',
}

export class AdminQueryDisputesDto {
  @IsOptional()
  @IsEnum(AdminDisputeStatus)
  status?: AdminDisputeStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}