import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
  Get,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { StartConversationDto } from './dto/start-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedUser {
  id?: number;
  sub?: number;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  @HttpCode(HttpStatus.OK)
  startConversation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: StartConversationDto,
  ) {
    const userId = currentUser.id ?? currentUser.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    return this.chatService.getOrCreateConversation(
      userId,
      body.listingId,
    );
  }

  @Post('messages')
sendMessage(
  @CurrentUser() currentUser: AuthenticatedUser,
  @Body() body: SendMessageDto,
) {
  const userId = currentUser.id ?? currentUser.sub;

  if (!userId) {
    throw new UnauthorizedException('Invalid authenticated user');
  }

  const message = this.chatService.sendMessage(userId, body);

  return message.then((savedMessage) => {
    this.chatGateway.emitConversationMessage(
      body.conversationId,
      savedMessage,
    );

    return savedMessage;
  });
}


@Get('conversations')
getUserConversations(
  @CurrentUser() currentUser: AuthenticatedUser,
) {
  const userId = currentUser.id ?? currentUser.sub;

  if (!userId) {
    throw new UnauthorizedException(
      'Invalid authenticated user',
    );
  }

  return this.chatService.getUserConversations(userId);
}

@Get('conversations/:conversationId/messages')
getConversationMessages(
  @CurrentUser() currentUser: AuthenticatedUser,

  @Param('conversationId', ParseIntPipe)
  conversationId: number,
) {
  const userId = currentUser.id ?? currentUser.sub;

  if (!userId) {
    throw new UnauthorizedException(
      'Invalid authenticated user',
    );
  }

  return this.chatService.getConversationMessages(
    userId,
    conversationId,
  );
}


@Patch('conversations/:conversationId/read')
markConversationAsRead(
  @CurrentUser() currentUser: AuthenticatedUser,

  @Param('conversationId', ParseIntPipe)
  conversationId: number,
) {
  const userId = currentUser.id ?? currentUser.sub;

  if (!userId) {
    throw new UnauthorizedException(
      'Invalid authenticated user',
    );
  }

  return this.chatService.markConversationAsRead(
    userId,
    conversationId,
  );
}

}
