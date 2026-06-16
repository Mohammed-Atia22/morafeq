import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  @IsPositive()
  conversationId!: number;

  @IsString()
  @IsNotEmpty({ message: 'Message content is required' })
  @MaxLength(2000, {
    message: 'Message must not exceed 2000 characters',
  })
  content!: string;
}