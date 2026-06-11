import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma:   PrismaService,
    private uploads:  UploadsService,
    private auth:     AuthService,
  ) {}

  // ─── Get my profile ────────────────────────

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:         true,
        email:      true,
        firstName:  true,
        lastName:   true,
        avatarUrl:  true,
        phone:      true,
        bio:        true,
        role:       true,
        isVerified: true,
        createdAt:  true,
        // count how many listings this user has
        _count: {
          select: { listings: true }
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  // ─── Get public profile ────────────────────

  async getPublicProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId, isActive: true },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        avatarUrl: true,
        bio:       true,
        createdAt: true,
        // show their listings
        _count: {
          select: { listings: true, reviews: true }
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  // ─── Update profile ────────────────────────

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data:  {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName  && { lastName:  dto.lastName  }),
        ...(dto.phone     && { phone:     dto.phone     }),
        ...(dto.bio       !== undefined && { bio: dto.bio }),
      },
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        avatarUrl: true,
        phone:     true,
        bio:       true,
        role:      true,
      },
    });

    return updated;
  }

  // ─── Upload avatar ─────────────────────────

  async uploadAvatar(userId: number, file: Express.Multer.File) {
  const result = await this.uploads.uploadImage(file, 'avatars');

  const user = await this.prisma.user.update({
    where: { id: userId },
    data:  { avatarUrl: result.url },
    select: {
      id:        true,
      email:     true,
      firstName: true,
      lastName:  true,
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

    // check if OAuth user trying to set password
    if (!user!.passwordHash) {
      throw new BadRequestException(
        'This account uses Google login and has no password to change'
      );
    }

    // verify current password is correct
    const isCurrentValid = bcrypt.compare(
      dto.currentPassword!,
      user!.passwordHash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // make sure new password is different
    const isSamePassword = await bcrypt.compare(
      dto.newPassword!,
      user!.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password'
      );
    }

    // hash and save new password
    const newHash = await bcrypt.hash(dto.newPassword!, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: newHash },
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

    // update role
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data:  { role: UserRole.HOST },
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        role:      true,
      },
    });

    // issue new tokens with updated role
    const tokens = await this.auth.refreshTokens(userId);

    return {
      message:     'You are now a host. Welcome!',
      user:        updated,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
