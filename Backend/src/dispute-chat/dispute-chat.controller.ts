import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DisputeChatService } from './dispute-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryConversationMessagesDto } from './dto/query-conversation-messages.dto';
import { SendDisputeChatMessageDto } from './dto/send-dispute-chat-message.dto';

@Controller('dispute-chat')
@UseGuards(JwtAuthGuard)
export class DisputeChatController {
  constructor(
    private readonly disputeChatService: DisputeChatService,
  ) {}

  // عرض محادثات المستخدم الحالي مع الأدمن
  @Get('conversations')
  getMyConversations(
    @CurrentUser() user: any,
  ) {
    return this.disputeChatService.getMyConversations(
      user.id,
    );
  }

  // عرض رسائل محادثة خاصة بالمستخدم الحالي
@Get('conversations/:conversationId/messages')
getConversationMessages(
  @Param('conversationId', ParseIntPipe)
  conversationId: number,

  @CurrentUser()
  user: any,

  @Query()
  query: QueryConversationMessagesDto,
) {
  return this.disputeChatService.getConversationMessages(
    conversationId,
    user.id,
    query.page,
    query.limit,
  );
}


// رد المغترب أو صاحب السكن على الأدمن
@Post('conversations/:conversationId/messages')
sendMessage(
  @Param('conversationId', ParseIntPipe)
  conversationId: number,

  @CurrentUser()
  user: any,

  @Body()
  dto: SendDisputeChatMessageDto,
) {
  return this.disputeChatService.sendMessage(
    conversationId,
    user.id,
    dto,
  );
}
}