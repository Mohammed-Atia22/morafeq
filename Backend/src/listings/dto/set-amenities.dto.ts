import { IsArray, IsString } from 'class-validator';

export class SetAmenitiesDto {
  @IsArray()
  @IsString({ each: true })
  amenities: string[] | undefined; // ['wifi', 'pool', 'kitchen', 'parking']
}