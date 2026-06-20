// src/users/constants/preference-keys.ts

export const VALID_PREFERENCE_KEYS = [
  // lifestyle
  'non_smoker',
  'smoker',
  'early_riser',
  'night_owl',
  'quiet',
  'social',
  'clean_freak',
  'pet_friendly',
  'no_pets',

  // study habits
  'studies_at_home',
  'studies_at_library',
  'group_study',

  // interests
  'football',
  'gaming',
  'reading',
  'gym',
  'music',
  'cooking',
  'traveling',

  // university — these are dynamic in practice but listed as examples
  'cairo_university',
  'ain_shams_university',
  'helwan_university',
  'german_university_cairo',
  'american_university_cairo',
] as const;

export type PreferenceKey = (typeof VALID_PREFERENCE_KEYS)[number];