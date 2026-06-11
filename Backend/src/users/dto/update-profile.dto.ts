import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';

enum GenderType {
  male = 'male',
  female = 'female',
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  // ─── New: phone country fields ─────────────
  @IsOptional()
  @IsString()
  @MaxLength(2)
  phoneCountry?: string;       // e.g. "EG", "SA"

  @IsOptional()
  @IsString()
  @MaxLength(5)
  phoneCountryCode?: string;   // e.g. "+20", "+966"

  // ─── New: gender ───────────────────────────
  @IsOptional()
  @IsEnum(GenderType, { message: 'Gender must be male or female' })
  gender?: GenderType;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;
}