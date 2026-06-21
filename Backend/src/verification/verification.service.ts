import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerificationStatus ,NotificationType} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
     private readonly notificationsService: NotificationsService,
  ) {}

  async submit(
    userId: number,
    files: {
      idFront?: Express.Multer.File[];
      idBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    const idFront = files.idFront?.[0];
    const idBack = files.idBack?.[0];
    const selfie = files.selfie?.[0];

    if (!idFront || !idBack || !selfie) {
      throw new BadRequestException(
        'Please upload ID front, ID back, and a selfie with your ID',
      );
    }

    const [frontUpload, backUpload, selfieUpload] = await Promise.all([
      this.uploads.uploadImage(idFront, 'verification_id_front'),
      this.uploads.uploadImage(idBack, 'verification_id_back'),
      this.uploads.uploadImage(selfie, 'verification_selfie'),
    ]);

    const verification = await this.prisma.verification.upsert({
      where: { userId },
      create: {
        userId,
        idFrontUrl: frontUpload.url,
        idBackUrl: backUpload.url,
        selfieUrl: selfieUpload.url,
        status: VerificationStatus.PENDING,
        rejectionReason: null,
      },
      update: {
        idFrontUrl: frontUpload.url,
        idBackUrl: backUpload.url,
        selfieUrl: selfieUpload.url,
        status: VerificationStatus.PENDING,
        rejectionReason: null,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return {
      message: 'Verification documents submitted for review',
      verification,
    };
  }

  async getMine(userId: number) {
    const verification = await this.prisma.verification.findUnique({
      where: { userId },
    });

    if (verification) return verification;

    return {
      userId,
      idFrontUrl: null,
      idBackUrl: null,
      selfieUrl: null,
      status: VerificationStatus.NOT_STARTED,
      rejectionReason: null,
      createdAt: null,
      updatedAt: null,
    };
  }

 async approve(id: number, adminId: number) {
  await this.assertAdmin(adminId);

  const verification =
    await this.prisma.verification.findUnique({
      where: { id },
    });

  if (!verification) {
    throw new NotFoundException(
      'Verification not found',
    );
  }

  // تحديث حالة التوثيق أولًا
  const updated = await this.prisma.$transaction(
    async (tx) => {
      const updatedVerification =
        await tx.verification.update({
          where: { id },
          data: {
            status: VerificationStatus.APPROVED,
            rejectionReason: null,
          },
        });

      await tx.user.update({
        where: {
          id: verification.userId,
        },
        data: {
          verificationStatus:
            VerificationStatus.APPROVED,

          ...(verification.status !==
            VerificationStatus.APPROVED && {
            trustScore: {
              increment: 25,
            },
          }),
        },
      });

      return updatedVerification;
    },
  );

  // إرسال إشعار داخل الموقع + Email
  try {
    await this.notificationsService.notifyUser({
      userId: verification.userId,

      type: NotificationType.USER_VERIFICATION_APPROVED,

      title: 'تم توثيق حسابك بنجاح',

      message:
        'تمت مراجعة المستندات والموافقة على طلب توثيق حسابك. أصبح حسابك الآن موثقًا على منصة مرافق.',

      relatedEntity: 'verification',
      relatedEntityId: verification.id,

      metadata: {
        verificationId: verification.id,
        status: VerificationStatus.APPROVED,
      },

      shouldSendEmail: true,

      emailSubject:
        'تم توثيق حسابك بنجاح - مرافق',
    });
  } catch (notificationError) {
    console.error(
      'Failed to create approval notification:',
      notificationError,
    );
  }

  return updated;
}

  async reject(
  id: number,
  adminId: number,
  rejectionReason: string,
) {
  await this.assertAdmin(adminId);

  const cleanedReason = rejectionReason?.trim();

  if (!cleanedReason) {
    throw new BadRequestException(
      'Rejection reason is required',
    );
  }

  const verification =
    await this.prisma.verification.findUnique({
      where: { id },
    });

  if (!verification) {
    throw new NotFoundException(
      'Verification not found',
    );
  }

  // تحديث حالة التوثيق أولًا
  const updated = await this.prisma.$transaction(
    async (tx) => {
      const updatedVerification =
        await tx.verification.update({
          where: { id },
          data: {
            status: VerificationStatus.REJECTED,
            rejectionReason: cleanedReason,
          },
        });

      await tx.user.update({
        where: {
          id: verification.userId,
        },
        data: {
          verificationStatus:
            VerificationStatus.REJECTED,
        },
      });

      return updatedVerification;
    },
  );

  // إرسال إشعار داخل الموقع + Email
  try {
    await this.notificationsService.notifyUser({
      userId: verification.userId,

      type: NotificationType.USER_VERIFICATION_REJECTED,

      title: 'لم تتم الموافقة على طلب التوثيق',

      message: `تمت مراجعة طلب توثيق حسابك، ولكن لم تتم الموافقة عليه للأسباب التالية:\n${cleanedReason}\n\nيمكنك تصحيح الملاحظات وإعادة إرسال طلب التوثيق.`,

      relatedEntity: 'verification',
      relatedEntityId: verification.id,

      metadata: {
        verificationId: verification.id,
        status: VerificationStatus.REJECTED,
        rejectionReason: cleanedReason,
      },

      shouldSendEmail: true,

      emailSubject:
        'تحديث بشأن طلب توثيق حسابك - مرافق',
    });
  } catch (notificationError) {
    console.error(
      'Failed to create rejection notification:',
      notificationError,
    );
  }

  return updated;
}

  private async assertAdmin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can review verifications');
    }
  }
}
