import { ArrayMaxSize, IsArray, IsIn } from 'class-validator';
import { VALID_PREFERENCE_KEYS } from '../constants/preference-keys';

export class SetPreferencesDto {
  @IsArray()
  @ArrayMaxSize(30)
  @IsIn(VALID_PREFERENCE_KEYS, { each: true })
  preferenceKeys!: string[];
}