import { IsInt, IsPositive } from 'class-validator';

export class StartConversationDto {
  @IsInt()
  @IsPositive()
  listingId!: number;
}