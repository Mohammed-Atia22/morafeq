import {
  GenderPreference,
  PropertyType,
  RoomType,
} from '@prisma/client';

export interface ListingSearchFilters {
  city?: string;
  governorate?: string;
  area?: string;
  maxRent?: number;
  minRent?: number;
  furnished?: boolean;
  internetIncluded?: boolean;
  utilitiesIncluded?: boolean;
  genderPreference?: GenderPreference;
  roomType?: RoomType;
  propertyType?: PropertyType;
}

export interface VectorMatch {
  listingId: number;
  textChunk: string;
  similarity: number;
}

export interface CompatibilityCandidateProfile {
  interests?: string[];
  sleepSchedule?: string;
  studyFrequency?: string;
  cleanlinessLevel?: string;
  smokingPreference?: string;
  cityPreferences?: string[];
  minRentPreference?: number;
  maxRentPreference?: number;
}

export interface CompatibilityMatchInput {
  student: CompatibilityCandidateProfile;
  candidate: CompatibilityCandidateProfile;
}

export interface CompatibilityMatcher {
  score(input: CompatibilityMatchInput): number;
}
