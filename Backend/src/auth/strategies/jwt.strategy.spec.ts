import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const secret = 'test_jwt_secret';
  const fingerprint = (passwordHash: string | null) =>
    crypto
      .createHmac('sha256', secret)
      .update(passwordHash ?? 'NO_PASSWORD')
      .digest('hex')
      .slice(0, 32);

  it('rejects tokens issued before the password hash changed', async () => {
    const strategy = new JwtStrategy(
      { get: jest.fn(() => secret) } as any,
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: 'user@example.com',
            role: 'GUEST',
            isActive: true,
            verificationStatus: 'NOT_STARTED',
            passwordHash: 'new-hash',
          }),
        },
      } as any,
    );

    await expect(
      strategy.validate({
        sub: 1,
        email: 'user@example.com',
        role: 'GUEST',
        pwdv: fingerprint('old-hash'),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
