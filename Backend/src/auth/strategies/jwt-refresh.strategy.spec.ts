import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy', () => {
  const secret = 'test_jwt_secret';
  const fingerprint = (passwordHash: string | null) =>
    crypto
      .createHmac('sha256', secret)
      .update(passwordHash ?? 'NO_PASSWORD')
      .digest('hex')
      .slice(0, 32);

  it('rejects refresh tokens issued before the password hash changed', async () => {
    const strategy = new JwtRefreshStrategy(
      {
        get: jest.fn((key: string) =>
          key === 'JWT_SECRET' ? secret : 'refresh_secret',
        ),
      } as any,
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: 'user@example.com',
            role: 'GUEST',
            isActive: true,
            passwordHash: 'new-hash',
          }),
        },
      } as any,
    );

    await expect(
      strategy.validate(
        { cookies: { refresh_token: 'token' } } as any,
        {
          sub: 1,
          email: 'user@example.com',
          role: 'GUEST',
          pwdv: fingerprint('old-hash'),
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
