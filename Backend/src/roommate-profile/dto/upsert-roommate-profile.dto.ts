import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import {
  RoommateAgeRange,
  RoommateCleanlinessLevel,
  RoommateConflictStyle,
  RoommateCookingFrequency,
  RoommateExpenseStyle,
  RoommateGuestPreference,
  RoommateOccupationType,
  RoommatePrivacyLevel,
  RoommateSleepSchedule,
  RoommateSmokingStatus,
  RoommateSmokingTolerance,
  RoommateStudyFrequency,
  RoomType,
} from '@prisma/client';

export class UpsertRoommateProfileDto {
  @IsOptional()
  @IsEnum(RoommateOccupationType)
  occupationType?: RoommateOccupationType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  university?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  faculty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  academicYear?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  workField?: string;

  @IsOptional()
  @IsEnum(RoommateAgeRange)
  ageRange?: RoommateAgeRange;


    @IsOptional()
  @IsInt()
  @Min(0)
  preferredMinRent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  preferredMaxRent?: number;

  @IsOptional()
  @IsEnum(RoomType)
  preferredRoomType?: RoomType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredGovernorate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsEnum(RoommateSleepSchedule)
  sleepSchedule?: RoommateSleepSchedule;

  @IsOptional()
  @IsEnum(RoommateStudyFrequency)
  studyFrequency?: RoommateStudyFrequency;

  @IsOptional()
  @IsEnum(RoommateCleanlinessLevel)
  cleanlinessLevel?: RoommateCleanlinessLevel;

  @IsOptional()
  @IsEnum(RoommateSmokingStatus)
  smokingStatus?: RoommateSmokingStatus;

  @IsOptional()
  @IsEnum(RoommateSmokingTolerance)
  smokingTolerance?: RoommateSmokingTolerance;

  @IsOptional()
  @IsEnum(RoommateGuestPreference)
  guestPreference?: RoommateGuestPreference;

  @IsOptional()
  @IsEnum(RoommatePrivacyLevel)
  privacyLevel?: RoommatePrivacyLevel;

  @IsOptional()
  @IsEnum(RoommateCookingFrequency)
  cookingFrequency?: RoommateCookingFrequency;

  @IsOptional()
  @IsEnum(RoommateExpenseStyle)
  expenseStyle?: RoommateExpenseStyle;

  @IsOptional()
  @IsEnum(RoommateConflictStyle)
  conflictStyle?: RoommateConflictStyle;
}
