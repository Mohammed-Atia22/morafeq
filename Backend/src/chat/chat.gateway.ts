import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { DisputeChatService } from '../dispute-chat/dispute-chat.service';

interface JwtPayload {
  sub?: number;
  id?: number;
  email?: string;
  role?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
  private readonly chatService: ChatService,

  // خدمة شات النزاعات
  private readonly disputeChatService: DisputeChatService,

  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
) {}

  async handleConnection(client: Socket) {
    try {
      // هنستقبل الـ token من frontend داخل handshake.auth
      const token = client.handshake.auth?.token as string | undefined;

      if (!token) {
        throw new Error('Access token is missing');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          secret:
            this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      const userId = payload.sub ?? payload.id;

      if (!userId) {
        throw new Error('Invalid token payload');
      }

      // نخزن userId داخل اتصال الـ socket
      client.data.userId = userId;
      client.data.role = payload.role;

      console.log(
        `Socket connected: ${client.id}, userId: ${userId}`,
      );
    } catch {
      client.emit('socketError', {
        message: 'Unauthorized socket connection',
      });

      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  // المستخدم يدخل غرفة المحادثة
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      conversationId: number;
    },
  ) {
    try {
      const userId = client.data.userId as number;
      const conversationId = Number(body.conversationId);

      if (!conversationId || conversationId < 1) {
        throw new WsException('Invalid conversation ID');
      }

      // لا تسمح لأي مستخدم غريب بدخول الغرفة
      await this.chatService.ensureConversationParticipant(
        userId,
        conversationId,
      );

      const roomName = `conversation:${conversationId}`;

      await client.join(roomName);

      return {
        success: true,
        conversationId,
      };
    } catch (error) {
      throw new WsException(
        error instanceof Error
          ? error.message
          : 'Could not join conversation',
      );
    }
  }

  // دخول غرفة محادثة النزاع الخاصة
@SubscribeMessage('joinDisputeConversation')
async joinDisputeConversation(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    conversationId: number;
  },
) {
  try {
    const userId = client.data.userId as number;
    const conversationId = Number(body.conversationId);

    if (!userId) {
      throw new WsException('Unauthorized socket');
    }

    if (
      !Number.isInteger(conversationId) ||
      conversationId < 1
    ) {
      throw new WsException(
        'Invalid dispute conversation ID',
      );
    }

    /*
      تتأكد أن المستخدم:
      - Admin نشط
      أو
      - هو المغترب/صاحب السكن صاحب المحادثة
    */
    const access =
      await this.disputeChatService.ensureConversationAccess(
        userId,
        conversationId,
      );

    const roomName =
      `dispute-conversation:${conversationId}`;

    await client.join(roomName);

    return {
      success: true,
      conversationId,
      roomName,
      accessType: access.accessType,
      isClosed: access.conversation.isClosed,
    };
  } catch (error) {
    throw new WsException(
      error instanceof Error
        ? error.message
        : 'Could not join dispute conversation',
    );
  }
}

  // إرسال الرسالة وحفظها
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ) {
    try {
      const userId = client.data.userId as number;

      if (!userId) {
        throw new WsException('Unauthorized socket');
      }

      const message = await this.chatService.sendMessage(
        userId,
        body,
      );

      const roomName = `conversation:${body.conversationId}`;

      // إرسال الرسالة لكل الموجودين داخل المحادثة
      this.server.to(roomName).emit('newMessage', message);

      return {
        success: true,
        message,
      };
    } catch (error) {
      throw new WsException(
        error instanceof Error
          ? error.message
          : 'Could not send message',
      );
    }
  }


  // إرسال رسالة لحظية داخل محادثة النزاع
@SubscribeMessage('sendDisputeMessage')
async sendDisputeMessage(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    conversationId: number;
    content: string;
  },
) {
  try {
    const userId = client.data.userId as number;
    const conversationId = Number(body.conversationId);

    if (!userId) {
      throw new WsException('Unauthorized socket');
    }

    if (
      !Number.isInteger(conversationId) ||
      conversationId < 1
    ) {
      throw new WsException(
        'Invalid dispute conversation ID',
      );
    }

    /*
      الـ Service تتأكد أن المرسل:
      - Admin
      أو
      - صاحب المحادثة نفسه
    */
    const message =
      await this.disputeChatService.sendRealtimeMessage(
        userId,
        conversationId,
        body.content,
      );

    const roomName =
      `dispute-conversation:${conversationId}`;

    /*
      ندخل المرسل للغرفة تلقائيًا كحماية إضافية،
      حتى لو لم يرسل joinDisputeConversation قبل الإرسال.
    */
    await client.join(roomName);

    // إرسال الرسالة لكل الموجودين داخل غرفة النزاع
    this.server
      .to(roomName)
      .emit('newDisputeMessage', message);

    return {
      success: true,
      message,
    };
  } catch (error) {
    throw new WsException(
      error instanceof Error
        ? error.message
        : 'Could not send dispute message',
    );
  }
}

// تعليم رسائل محادثة النزاع كمقروءة لحظيًا
@SubscribeMessage('markDisputeMessagesAsRead')
async markDisputeMessagesAsRead(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    conversationId: number;
  },
) {
  try {
    const userId = client.data.userId as number;
    const conversationId = Number(body.conversationId);

    if (!userId) {
      throw new WsException('Unauthorized socket');
    }

    if (
      !Number.isInteger(conversationId) ||
      conversationId < 1
    ) {
      throw new WsException(
        'Invalid dispute conversation ID',
      );
    }

    /*
      الـ Service تتأكد إن المستخدم:
      - Admin
      أو
      - صاحب المحادثة
    */
    const result =
      await this.disputeChatService.markRealtimeMessagesAsRead(
        userId,
        conversationId,
      );

    const roomName =
      `dispute-conversation:${conversationId}`;

    /*
      ندخل المستخدم الغرفة تلقائيًا؛
      حتى لو لم ينفذ joinDisputeConversation قبلها.
    */
    await client.join(roomName);

    // إبلاغ كل الموجودين في المحادثة بحالة القراءة
    this.server
      .to(roomName)
      .emit('disputeMessagesRead', result);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    throw new WsException(
      error instanceof Error
        ? error.message
        : 'Could not mark dispute messages as read',
    );
  }
}


  @SubscribeMessage('markAsRead')
async markAsRead(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    conversationId: number;
  },
) {
  try {
    const userId = client.data.userId as number;
    const conversationId = Number(body.conversationId);

    if (!userId) {
      return {
        success: false,
        message: 'Unauthorized socket',
      };
    }

    if (!conversationId || conversationId < 1) {
      return {
        success: false,
        message: 'Invalid conversation ID',
      };
    }

    const result =
      await this.chatService.markConversationAsRead(
        userId,
        conversationId,
      );

    const roomName = `conversation:${conversationId}`;

    // إبلاغ الطرفين إن الرسائل تمت قراءتها
    this.server
      .to(roomName)
      .emit('messagesRead', result);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('markAsRead socket error:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Could not mark messages as read',
    };
  }
}
}