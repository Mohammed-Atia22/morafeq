import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GeocodeAddressDto {
  @IsString()
  @IsNotEmpty()
  streetName: string;

  @IsString()
  @IsOptional()
  buildingNumber?: string;

  @IsString()
  @IsOptional()
  nearbyLandmark?: string;

  @IsString()
  @IsOptional()
  areaName?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  governorate: string;

  @IsString()
  @IsOptional()
  country?: string;
}
