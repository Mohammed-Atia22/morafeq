/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config: ConfigService) {
    super({
      clientID:     config.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL:  config.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { name, emails, photos } = profile;

    // extract what we need from the Google profile
    const user = {
      email:     emails[0].value,
      firstName: name.givenName,
      lastName:  name.familyName,
      avatarUrl: photos[0]?.value,
    };

    done(null, user);
  }
}