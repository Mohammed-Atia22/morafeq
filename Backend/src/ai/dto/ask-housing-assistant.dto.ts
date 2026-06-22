import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskHousingAssistantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  query: string;
}
