/* eslint-disable prettier/prettier */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.query?.error) {
      request.user = null;
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}
