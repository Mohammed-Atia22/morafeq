
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EmailDeliveryStatus,
  Notification,
  NotificationType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { sendEmail } from '../common/emails/sendEmail';

export interface NotifyUserInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;

  relatedEntity?: string;
  relatedEntityId?: number;
  metadata?: Prisma.InputJsonValue;

  shouldSendEmail?: boolean;
  emailSubject?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * إنشاء إشعار للمستخدم، مع إمكانية إرسال Email.
   */
  async notifyUser(
    data: NotifyUserInput,
  ): Promise<Notification> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const title = data.title.trim();
    const message = data.message.trim();

    const shouldSendEmail =
      data.shouldSendEmail ?? false;

    // أولًا: حفظ الإشعار في قاعدة البيانات
    let notification =
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: data.type,
          title,
          message,

          relatedEntity:
            data.relatedEntity?.trim() || null,

          relatedEntityId:
            data.relatedEntityId ?? null,

          metadata: data.metadata,

          emailStatus: shouldSendEmail
            ? EmailDeliveryStatus.PENDING
            : EmailDeliveryStatus.NOT_REQUESTED,
        },
      });

    if (!shouldSendEmail) {
      return notification;
    }

    // ثانيًا: محاولة إرسال البريد
    try {
      await sendEmail({
        to: user.email,

        subject:
          data.emailSubject?.trim() || title,

        html: this.buildEmailTemplate({
          firstName: user.firstName,
          title,
          message,
        }),
      });

      notification =
        await this.prisma.notification.update({
          where: {
            id: notification.id,
          },
          data: {
            emailStatus:
              EmailDeliveryStatus.SENT,

            emailSentAt: new Date(),
            emailError: null,
          },
        });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown email error';

      console.error(
        `Failed to send notification email to user ${user.id}:`,
        error,
      );

      // فشل البريد لا يلغي الإشعار نفسه
      notification =
        await this.prisma.notification.update({
          where: {
            id: notification.id,
          },
          data: {
            emailStatus:
              EmailDeliveryStatus.FAILED,

            emailError: errorMessage,
          },
        });
    }

    return notification;
  }

  /**
   * جلب إشعارات المستخدم.
   */
  async findUserNotifications(
    userId: number,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * عدد الإشعارات غير المقروءة.
   */
  async getUnreadCount(
    userId: number,
  ): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * تعليم إشعار واحد كمقروء.
   */
  async markAsRead(
    userId: number,
    notificationId: number,
  ): Promise<Notification> {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * تعليم كل إشعارات المستخدم كمقروءة.
   */
  async markAllAsRead(userId: number) {
    const readAt = new Date();

    const result =
      await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt,
        },
      });

    return {
      updatedCount: result.count,
      readAt,
    };
  }

  /**
   * قالب البريد العام.
   */
  private buildEmailTemplate(data: {
    firstName: string;
    title: string;
    message: string;
  }): string {
    const firstName = this.escapeHtml(
      data.firstName,
    );

    const title = this.escapeHtml(data.title);

    const message = this.escapeHtml(
      data.message,
    ).replace(/\r?\n/g, '<br />');

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
        </head>

        <body
          style="
            margin: 0;
            padding: 24px;
            background-color: #f4f7fb;
            font-family: Arial, sans-serif;
            color: #172033;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 14px;
              padding: 28px;
              border: 1px solid #e5e7eb;
            "
          >
            <h2
              style="
                margin-top: 0;
                color: #0b62d8;
              "
            >
              ${title}
            </h2>

            <p>
              مرحبًا ${firstName}،
            </p>

            <div
              style="
                margin: 20px 0;
                padding: 16px;
                background-color: #f8fafc;
                border-radius: 10px;
                border-right: 4px solid #0b62d8;
                line-height: 1.8;
              "
            >
              ${message}
            </div>

            <p
              style="
                margin-bottom: 0;
                color: #64748b;
              "
            >
              مع تحيات فريق مرافق
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * حماية محتوى البريد من HTML غير موثوق.
   */
  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}

