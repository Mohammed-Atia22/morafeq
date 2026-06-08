import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateLocationInsightDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(3000)
  radiusMeters?: number;
}
