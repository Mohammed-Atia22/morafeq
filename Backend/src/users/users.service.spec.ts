import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UsersService } from './users.service';

jest.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new UsersService(
      prisma as unknown as PrismaService,
      {} as UploadsService,
      {} as any,
    );
  });

  it('rejects role changes from the profile endpoint', async () => {
    await expect(
      service.updateProfile(1, { role: UserRole.ADMIN } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects changePassword when the current password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      passwordHash: await bcrypt.hash('CorrectPass@123', 12),
    });

    await expect(
      service.changePassword(1, {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPass@123',
      }),
    ).rejects.toMatchObject({
      message: 'Current password is incorrect',
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
