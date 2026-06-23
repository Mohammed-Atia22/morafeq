/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import * as crypto from 'crypto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // look for token in Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  // this runs automatically after token signature is verified
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        verificationStatus: true,
        passwordHash: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    if (payload.pwdv !== this.passwordFingerprint(user.passwordHash)) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    // whatever you return here gets attached to request.user
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private passwordFingerprint(passwordHash?: string | null) {
    const secret = this.config.get<string>('JWT_SECRET') ?? 'dev_jwt_secret';

    return crypto
      .createHmac('sha256', secret)
      .update(passwordHash ?? 'NO_PASSWORD')
      .digest('hex')
      .slice(0, 32);
  }
}
