import {
  IsBoolean,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
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
import { CreateRoomDto } from './create-room.dto';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsEnum(RoomType)
  roomType!: RoomType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  streetName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  buildingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  floorNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  apartmentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nearbyLandmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  arrivalInstructions?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  governorate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsString()
  @IsNotEmpty()
  areaName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleFormattedAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  googlePlaceId?: string;

  @IsOptional()
  @IsEnum(LocationPrivacy)
  locationPrivacy?: LocationPrivacy;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  monthlyRent!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTenants!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bedrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  beds!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bathrooms!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  furnished?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  utilitiesIncluded?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  internetIncluded?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumStayMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maximumStayMonths?: number;

  @IsDateString()
  availableFrom!: string;

  @IsOptional()
  @IsEnum(GenderPreference)
  genderPreference?: GenderPreference;

  @IsOptional()
  @IsEnum(SmokingPolicy)
  smokingPolicy?: SmokingPolicy;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomDto)
  rooms?: CreateRoomDto[];
}
