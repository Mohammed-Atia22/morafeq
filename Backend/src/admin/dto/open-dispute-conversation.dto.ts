import { IsEnum } from 'class-validator';
import { DisputeParticipantType } from '@prisma/client';

export class OpenDisputeConversationDto {
  @IsEnum(DisputeParticipantType)
  participantType: DisputeParticipantType;
}