import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchPlaceDto {
  @IsString()
  @IsNotEmpty()
  q: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  governorate?: string;

  @IsString()
  @IsOptional()
  country?: string;
}
