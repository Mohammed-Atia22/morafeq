import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendDisputeChatMessageDto } from './dto/send-dispute-chat-message.dto';


@Injectable()
export class DisputeChatService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMyConversations(userId: number) {
    /*
      بنرجع فقط المحادثات التي يكون المستخدم الحالي
      هو الطرف الموجود فيها.
    */
    const conversations =
      await this.prisma.disputeConversation.findMany({
        where: {
          participantId: userId,
        },

        orderBy: {
          updatedAt: 'desc',
        },

        select: {
          id: true,
          bookingId: true,
          participantId: true,
          participantType: true,
          isClosed: true,
          createdAt: true,
          updatedAt: true,

          booking: {
            select: {
              id: true,
              status: true,
              disputeReason: true,
              disputedAt: true,

              listing: {
                select: {
                  id: true,
                  title: true,

                  photos: {
                    where: {
                      isCover: true,
                    },
                    take: 1,
                    select: {
                      id: true,
                      url: true,
                    },
                  },
                },
              },
            },
          },

          /*
            نرجع آخر رسالة فقط حتى تظهر في قائمة
            المحادثات مثل تطبيقات الشات.
          */
          messages: {
            orderBy: [
              {
                createdAt: 'desc',
              },
              {
                id: 'desc',
              },
            ],

            take: 1,

            select: {
              id: true,
              senderId: true,
              content: true,
              isRead: true,
              readAt: true,
              createdAt: true,

              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
          },

          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

    /*
      نحسب عدد رسائل الأدمن التي لم يقرأها المستخدم
      في كل محادثة.
    */
    const data = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount =
          await this.prisma.disputeMessage.count({
            where: {
              conversationId: conversation.id,

              // الرسالة ليست مرسلة من المستخدم نفسه
              senderId: {
                not: userId,
              },

              isRead: false,
            },
          });

        const lastMessage =
          conversation.messages[0] ?? null;

        const {
          messages,
          ...conversationData
        } = conversation;

        return {
          ...conversationData,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return {
      data,
      meta: {
        total: data.length,
      },
    };
  }

  async getConversationMessages(
  conversationId: number,
  userId: number,
  page = 1,
  limit = 50,
) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  /*
    لازم المحادثة تكون موجودة،
    والمستخدم الحالي هو الطرف الموجود فيها.
  */
  const conversation =
    await this.prisma.disputeConversation.findUnique({
      where: {
        id: conversationId,
      },

      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,

        booking: {
          select: {
            id: true,
            status: true,
            disputeReason: true,
            disputedAt: true,

            listing: {
              select: {
                id: true,
                title: true,

                photos: {
                  where: {
                    isCover: true,
                  },
                  take: 1,
                  select: {
                    id: true,
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!conversation) {
    throw new NotFoundException(
      'Dispute conversation not found',
    );
  }

  /*
    أهم حماية:
    أي مستخدم لا يمكنه فتح محادثة لا تخصه.
  */
  if (conversation.participantId !== userId) {
    throw new ForbiddenException(
      'You do not have permission to view this conversation',
    );
  }

  // عند فتح المستخدم للمحادثة:
// نعلّم رسائل الأدمن غير المقروءة كمقروءة
const readAt = new Date();

await this.prisma.disputeMessage.updateMany({
  where: {
    conversationId,

    // الرسائل التي لم يرسلها المستخدم نفسه
    senderId: {
      not: userId,
    },

    isRead: false,
  },

  data: {
    isRead: true,
    readAt,
  },
});

  const [messages, total] = await Promise.all([
    this.prisma.disputeMessage.findMany({
      where: {
        conversationId,
      },

      skip,
      take: safeLimit,

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        isRead: true,
        readAt: true,
        createdAt: true,

        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    }),

    this.prisma.disputeMessage.count({
      where: {
        conversationId,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / safeLimit);

  const formattedMessages = messages
    .reverse()
    .map((message) => ({
      ...message,

      senderType:
        message.sender.role === 'ADMIN'
          ? 'ADMIN'
          : message.senderId === userId
            ? conversation.participantType
            : 'UNKNOWN',

      isMine: message.senderId === userId,
    }));

  return {
    conversation,

    data: formattedMessages,

    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
    },
  };
}


async ensureConversationAccess(
  userId: number,
  conversationId: number,
) {
  const [user, conversation] = await Promise.all([
    this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    }),

    this.prisma.disputeConversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,

        booking: {
          select: {
            id: true,
            status: true,
            disputedAt: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!user.isActive) {
    throw new ForbiddenException(
      'Your account is inactive',
    );
  }

  if (!conversation) {
    throw new NotFoundException(
      'Dispute conversation not found',
    );
  }

  const isAdmin = user.role === 'ADMIN';

  const isConversationParticipant =
    conversation.participantId === userId;

  if (!isAdmin && !isConversationParticipant) {
    throw new ForbiddenException(
      'You do not have permission to access this dispute conversation',
    );
  }

  return {
    user: {
      id: user.id,
      role: user.role,
    },

    conversation,

    accessType: isAdmin
      ? 'ADMIN'
      : conversation.participantType,
  };
}


async sendMessage(
  conversationId: number,
  userId: number,
  dto: SendDisputeChatMessageDto,
) {
  // نتأكد إن المحادثة موجودة
  const conversation =
    await this.prisma.disputeConversation.findUnique({
      where: {
        id: conversationId,
      },

      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,

        booking: {
          select: {
            id: true,
            status: true,
            disputedAt: true,
          },
        },
      },
    });

  if (!conversation) {
    throw new NotFoundException(
      'Dispute conversation not found',
    );
  }

  // المستخدم يقدر يرسل داخل محادثته هو فقط
  if (conversation.participantId !== userId) {
    throw new ForbiddenException(
      'You do not have permission to send messages in this conversation',
    );
  }

  // منع الرد بعد إغلاق المحادثة
  if (conversation.isClosed) {
    throw new BadRequestException(
      'This dispute conversation is closed',
    );
  }

  // حماية إضافية: الحجز لازم يكون دخل في نزاع
  if (!conversation.booking.disputedAt) {
    throw new BadRequestException(
      'This booking does not have a dispute',
    );
  }

  const content = dto.content.trim();

  if (!content) {
    throw new BadRequestException(
      'Message content cannot be empty',
    );
  }

  const message = await this.prisma.$transaction(
    async (tx) => {
      // حفظ رسالة المغترب أو صاحب السكن
      const createdMessage =
        await tx.disputeMessage.create({
          data: {
            conversationId,
            senderId: userId,
            content,

            // الأدمن لم يقرأ الرسالة بعد
            isRead: false,
          },

          select: {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            isRead: true,
            readAt: true,
            createdAt: true,

            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        });

      // تحديث المحادثة عشان تظهر كأحدث محادثة
      await tx.disputeConversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return createdMessage;
    },
  );

  return {
    message: 'Message sent successfully',

    data: {
      ...message,

      // ستكون GUEST أو HOST حسب المحادثة
      senderType: conversation.participantType,

      recipientType: 'ADMIN',
    },
  };
}


async sendRealtimeMessage(
  userId: number,
  conversationId: number,
  content: string,
) {
  // تتأكد أن المستخدم أدمن أو هو صاحب المحادثة
  const access = await this.ensureConversationAccess(
    userId,
    conversationId,
  );

  if (access.conversation.isClosed) {
    throw new BadRequestException(
      'This dispute conversation is closed',
    );
  }

  if (!access.conversation.booking.disputedAt) {
    throw new BadRequestException(
      'This booking does not have a dispute',
    );
  }

  const cleanedContent = content?.trim();

  if (!cleanedContent) {
    throw new BadRequestException(
      'Message content cannot be empty',
    );
  }

  if (cleanedContent.length > 2000) {
    throw new BadRequestException(
      'Message content cannot exceed 2000 characters',
    );
  }

  const message = await this.prisma.$transaction(
    async (tx) => {
      const createdMessage =
        await tx.disputeMessage.create({
          data: {
            conversationId,
            senderId: userId,
            content: cleanedContent,
            isRead: false,
          },

          select: {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            isRead: true,
            readAt: true,
            createdAt: true,

            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        });

      await tx.disputeConversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return createdMessage;
    },
  );

  const senderType =
    access.user.role === 'ADMIN'
      ? 'ADMIN'
      : access.conversation.participantType;

  return {
    ...message,
    senderType,


    recipientType:
      senderType === 'ADMIN'
        ? access.conversation.participantType
        : 'ADMIN',
  };
}

async markRealtimeMessagesAsRead(
  userId: number,
  conversationId: number,
) {
  
  const access = await this.ensureConversationAccess(
    userId,
    conversationId,
  );

  const readAt = new Date();

  
  const result =
    await this.prisma.disputeMessage.updateMany({
      where: {
        conversationId,
        isRead: false,

        ...(access.user.role === 'ADMIN'
          ? {
              // الأدمن يقرأ رسائل الطرف الآخر
              senderId:
                access.conversation.participantId,
            }
          : {
              // الطرف يقرأ كل الرسائل غير المرسلة منه
              // وهي رسائل الأدمن
              senderId: {
                not: userId,
              },
            }),
      },

      data: {
        isRead: true,
        readAt,
      },
    });

  return {
    conversationId,
    readerId: userId,

    readerType:
      access.user.role === 'ADMIN'
        ? 'ADMIN'
        : access.conversation.participantType,

    readAt,
    updatedMessagesCount: result.count,
  };
}
}