import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { maskPhoneNumbers } from './../utils/mask-phone-numbers';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(guestId: number, listingId: number) {
    const listing = await this.prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      select: {
        id: true,

        // غيّر ownerId لو اسم صاحب الإعلان عندك مختلف
        hostId: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const hostId = listing.hostId;

    if (guestId === hostId) {
      throw new ForbiddenException(
        'You cannot start a conversation with yourself',
      );
    }

    const conversation = await this.prisma.conversation.upsert({
      where: {
        guestId_hostId_listingId: {
          guestId,
          hostId,
          listingId,
        },
      },

      update: {},

      create: {
        guestId,
        hostId,
        listingId,
      },

      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },

        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },

        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return conversation;
  }


 async sendMessage(senderId: number, body: SendMessageDto) {
  const { conversationId, content } = body;

  await this.ensureConversationParticipant(
    senderId,
    conversationId,
  );

  const cleanedContent = content.trim();

  if (!cleanedContent) {
    throw new BadRequestException(
      'Message content cannot be empty',
    );
  }

  // إخفاء أي رقم هاتف قبل الحفظ
  const safeContent = maskPhoneNumbers(cleanedContent);

  const message = await this.prisma.message.create({
    data: {
      conversationId,
      senderId,

      // نخزن النسخة المخفية فقط
      content: safeContent,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  await this.prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return message;
}


async ensureConversationParticipant(
  userId: number,
  conversationId: number,
) {
  const conversation = await this.prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      guestId: true,
      hostId: true,
    },
  });

  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }

  const isParticipant =
    conversation.guestId === userId ||
    conversation.hostId === userId;

  if (!isParticipant) {
    throw new ForbiddenException(
      'You are not a participant in this conversation',
    );
  }

  return conversation;
}


async getConversationMessages(
  userId: number,
  conversationId: number,
) {
  await this.ensureConversationParticipant(
    userId,
    conversationId,
  );

  return this.prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
}



async getUserConversations(userId: number) {
  const conversations =
    await this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            guestId: userId,
          },
          {
            hostId: userId,
          },
        ],
      },

      orderBy: {
        updatedAt: 'desc',
      },

      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },

        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },

        listing: {
          select: {
            id: true,
            title: true,
          },
        },

        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },

        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: {
                  not: userId,
                },
              },
            },
          },
        },
      },
    });

  return conversations.map((conversation) => {
    const otherUser =
      conversation.guestId === userId
        ? conversation.host
        : conversation.guest;

    return {
      id: conversation.id,
      listingId: conversation.listingId,
      listing: conversation.listing,
      otherUser,
      lastMessage: conversation.messages[0] ?? null,
      unreadCount: conversation._count.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  });
}


async markConversationAsRead(
  userId: number,
  conversationId: number,
) {
  await this.ensureConversationParticipant(
    userId,
    conversationId,
  );

  const result = await this.prisma.message.updateMany({
    where: {
      conversationId,

      // متعلمش رسائل المستخدم نفسه كمقروءة
      senderId: {
        not: userId,
      },

      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    message: 'Messages marked as read',
    updatedMessagesCount: result.count,
  };
}
}