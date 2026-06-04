/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// use @UseGuards(JwtAuthGuard) on any route that requires login
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}