/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private config: ConfigService) {
    super({
      // extract refresh token from cookie instead of header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return payload;
  }
}