import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
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
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let uploads: {
    uploadImage: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    uploads = {
      uploadImage: jest.fn(),
    };

    service = new UsersService(
      prisma as unknown as PrismaService,
      uploads as unknown as UploadsService,
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

  it('stores an encrypted phone number when updating the profile', async () => {
    process.env.PHONE_CRYPTO_SECRET = 'test_phone_crypto_secret';
    process.env.PHONE_HASH_SECRET = 'test_phone_hash_secret';
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.update.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 1,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        phone: data.phone,
        phoneCountry: data.phoneCountry,
        phoneCountryCode: data.phoneCountryCode,
        gender: 'male',
        bio: null,
        role: UserRole.GUEST,
        verificationStatus: 'NOT_STARTED',
        trustScore: 0,
      }),
    );

    await service.updateProfile(1, { phone: '+201001234567' });

    const savedPhone = prisma.user.update.mock.calls[0][0].data.phone;
    expect(savedPhone).not.toBe('+201001234567');
    expect(savedPhone).toEqual(expect.any(String));
    expect(
      CryptoJS.AES.decrypt(
        savedPhone,
        'test_phone_crypto_secret',
      ).toString(CryptoJS.enc.Utf8),
    ).toBe('+201001234567');
  });

  it('rejects avatar files that are not JPEG or PNG', async () => {
    await expect(
      service.uploadAvatar(1, {
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('MZ'),
      } as Express.Multer.File),
    ).rejects.toMatchObject({
      message: 'Invalid file type. Only JPEG and PNG allowed',
    });

    expect(uploads.uploadImage).not.toHaveBeenCalled();
  });

  it('rejects a spoofed PNG avatar whose bytes are not PNG', async () => {
    await expect(
      service.uploadAvatar(1, {
        mimetype: 'image/png',
        buffer: Buffer.from('MZ executable'),
      } as Express.Multer.File),
    ).rejects.toMatchObject({
      message: 'Invalid file type. Only JPEG and PNG allowed',
    });

    expect(uploads.uploadImage).not.toHaveBeenCalled();
  });
});
