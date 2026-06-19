import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendDisputeChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}