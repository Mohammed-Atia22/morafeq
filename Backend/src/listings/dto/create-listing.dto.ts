import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Currency,
  GenderPreference,
  LocationPrivacy,
  PropertyType,
  RoomType,
  SmokingPolicy,
} from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsEnum(RoomType)
  roomType: RoomType;

  @IsString()
  @IsNotEmpty()
  streetName: string;

  @IsString()
  @IsOptional()
  buildingNumber?: string;

  @IsString()
  @IsOptional()
  floorNumber?: string;

  @IsString()
  @IsOptional()
  apartmentNumber?: string;

  @IsString()
  @IsOptional()
  nearbyLandmark?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  governorate: string;

  @IsString()
  @IsOptional()
  country?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsString()
  @IsNotEmpty()
  areaName: string;

  @IsString()
  @IsOptional()
  googleFormattedAddress?: string;

  @IsString()
  @IsOptional()
  googlePlaceId?: string;

  @IsEnum(LocationPrivacy)
  @IsOptional()
  locationPrivacy?: LocationPrivacy;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  monthlyRent: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTenants: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bedrooms: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  beds: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bathrooms: number;

  @IsString()
  @IsNotEmpty()
  availableFrom: string;

  @IsEnum(GenderPreference)
  @IsOptional()
  genderPreference?: GenderPreference;

  @IsEnum(SmokingPolicy)
  @IsOptional()
  smokingPolicy?: SmokingPolicy;
}
