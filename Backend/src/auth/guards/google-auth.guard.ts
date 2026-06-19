/* eslint-disable prettier/prettier */
import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (request.query?.error) {
      response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`);
      return false;
    }

    return super.canActivate(context);
  }
}
