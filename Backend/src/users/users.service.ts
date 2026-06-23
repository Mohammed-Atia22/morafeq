import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { SetPreferencesDto } from './dto/set-preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private auth: AuthService,
  ) {}

  // ─── Get my profile ────────────────────────

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        phoneCountry: true, // ← added
        phoneCountryCode: true, // ← added
        bio: true,
        gender: true, // ← added
        role: true,
        isVerified: true,
        verificationStatus: true,
        trustScore: true,
        onboardingCompleted: true, // ← added
        createdAt: true,
        passwordHash: true, // ← for checking if user has password
        _count: {
          select: { listings: true, favorites: true },
        },
        verification: {
          select: {
            status: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const currentVerificationStatus =
      user.verification?.status ?? VerificationStatus.NOT_STARTED;

    if (currentVerificationStatus !== user.verificationStatus) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: currentVerificationStatus },
      });

      user.verificationStatus = currentVerificationStatus;
    }

    if (user.phone) {
      user.phone = this.decryptPhoneForDisplay(user.phone);
    }

    return user;
  }

  // ─── Get public profile ────────────────────

  async getPublicProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        verificationStatus: true,
        trustScore: true,
        isVerified: true,
        _count: {
          select: { listings: true, reviewsReceived: true },
        },
        verification: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const currentVerificationStatus =
      user.verification?.status ?? VerificationStatus.NOT_STARTED;

    if (currentVerificationStatus !== user.verificationStatus) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: currentVerificationStatus },
      });
    }

    return {
      ...user,
      verificationStatus: currentVerificationStatus,
      verification: undefined,
    };
  }

  // ─── Update profile ────────────────────────

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (Object.prototype.hasOwnProperty.call(dto, 'role')) {
      throw new BadRequestException(
        'Role cannot be changed from the profile endpoint',
      );
    }

    const phoneUpdate = dto.phone
      ? await this.buildPhoneUpdate(userId, dto.phone, dto.phoneCountry)
      : {};

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...phoneUpdate,
        ...(dto.gender && { gender: dto.gender }), // ← added
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        phoneCountry: true,
        phoneCountryCode: true,
        gender: true,
        bio: true,
        role: true,
        verificationStatus: true,
        trustScore: true,
      },
    });

    if (updated.phone) {
      updated.phone = this.decryptPhoneForDisplay(updated.phone);
    }

    return updated;
  }

  private decryptPhoneForDisplay(phone: string) {
    const phoneCryptoSecret =
      process.env.PHONE_CRYPTO_SECRET ?? 'dev_phone_crypto_secret';

    const decrypted = CryptoJS.AES.decrypt(phone, phoneCryptoSecret).toString(
      CryptoJS.enc.Utf8,
    );

    if (decrypted) return decrypted;

    // Recover numbers saved before profile updates used phone encryption.
    return /^[+\d]/.test(phone) ? phone : '';
  }

  private async buildPhoneUpdate(
    userId: number,
    phone: string,
    country?: string,
  ) {
    const rawPhone = phone.trim();
    const normalizedCountry = country?.trim().toUpperCase() || undefined;
    const phoneNumber = rawPhone.startsWith('+')
      ? parsePhoneNumberFromString(rawPhone)
      : parsePhoneNumberFromString(rawPhone, normalizedCountry as any);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new BadRequestException('ادخل رقم هاتف صحيح');
    }

    const normalizedPhone = phoneNumber.number;
    const phoneCountry = phoneNumber.country ?? normalizedCountry ?? null;
    const phoneCountryCode = `+${phoneNumber.countryCallingCode}`;
    const phoneCryptoSecret =
      process.env.PHONE_CRYPTO_SECRET ?? 'dev_phone_crypto_secret';
    const phoneHashSecret =
      process.env.PHONE_HASH_SECRET ?? 'dev_phone_hash_secret';
    const phoneHash = CryptoJS.HmacSHA256(
      normalizedPhone,
      phoneHashSecret,
    ).toString();

    const existingPhone = await this.prisma.user.findFirst({
      where: {
        phoneHash,
        id: { not: userId },
      },
    });

    if (existingPhone) {
      throw new ConflictException('رقم الهاتف مسجل بالفعل');
    }

    return {
      phone: CryptoJS.AES.encrypt(
        normalizedPhone,
        phoneCryptoSecret,
      ).toString(),
      phoneCountry,
      phoneCountryCode,
      phoneHash,
    };
  }

  // ─── Upload avatar ─────────────────────────

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an avatar image');
    }

    const result = await this.uploads.uploadImage(file, 'avatars');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.url },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    return user;
  }

  // ─── Change password ───────────────────────

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user!.passwordHash) {
      throw new BadRequestException(
        'This account uses Google login and has no password to change',
      );
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword!,
      user!.passwordHash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword!,
      user!.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword!, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  // ─── Become a host ─────────────────────────

  async becomeHost(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === UserRole.HOST) {
      throw new BadRequestException('You are already a host');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.HOST },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        verificationStatus: true,
        trustScore: true,
      },
    });

    const tokens = await this.auth.refreshTokens(userId);

    return {
      message: 'You are now a host. Welcome!',
      user: updated,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ─── Set/replace all preferences ───────────

  async setPreferences(userId: number, dto: SetPreferencesDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== UserRole.GUEST) {
      throw new ForbiddenException(
        'Only expatriate profiles can set roommate preferences',
      );
    }

    // replace strategy: delete all existing, insert the new set
    // simplest and safest for a "select your tags" UI
    await this.prisma.$transaction([
      this.prisma.userPreference.deleteMany({
        where: { userId },
      }),
      this.prisma.userPreference.createMany({
        data: dto.preferenceKeys.map((preferenceKey) => ({
          userId,
          preferenceKey,
        })),
      }),
    ]);

    return this.getPreferences(userId);
  }

  // ─── Get current preferences ───────────────

  async getPreferences(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== UserRole.GUEST) {
      return [];
    }

    const preferences = await this.prisma.userPreference.findMany({
      where: { userId },
      select: { preferenceKey: true },
    });

    return preferences.map((p) => p.preferenceKey);
  }

  // ─── Add a single preference (optional convenience) ──

  async addPreference(userId: number, preferenceKey: string) {
    return this.prisma.userPreference.upsert({
      where: {
        userId_preferenceKey: { userId, preferenceKey },
      },
      update: {},
      create: { userId, preferenceKey },
    });
  }

  // ─── Remove a single preference ────────────

  async removePreference(userId: number, preferenceKey: string) {
    await this.prisma.userPreference.deleteMany({
      where: { userId, preferenceKey },
    });

    return { message: 'Preference removed' };
  }
}
