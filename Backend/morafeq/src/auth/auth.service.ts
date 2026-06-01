/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma:  PrismaService,
    private jwt:     JwtService,
    private config:  ConfigService,
  ) {}

  // ─── Register ──────────────────────────────

  async register(dto: RegisterDto) {
    // 1. check email not already used
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('This email is already registered');
    }

    // 2. hash the password — never store plain text
    // 12 = how hard it is to crack (higher = safer but slower)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 3. create the user
    const user = await this.prisma.user.create({
      data: {
        email:        dto.email.toLowerCase(),
        passwordHash,
        firstName:    dto.firstName,
        lastName:     dto.lastName,
        phone:        dto.phone,
      },
      // only return these fields — never return passwordHash
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        role:      true,
        createdAt: true,
      },
    });

    // 4. generate tokens and return
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return { user, ...tokens };
  }

  // ─── Login ─────────────────────────────────

  async login(dto: LoginDto) {
    // 1. find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // use same error for wrong email and wrong password
    // never tell the attacker which one is wrong
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // 2. check if this is a Google-only account
    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses Google login. Please sign in with Google.',
      );
    }

    // 3. compare password with stored hash
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      user: {
        id:        user.id,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        role:      user.role,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  // ─── Google OAuth ──────────────────────────

  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }) {
    // upsert = update if exists, create if not
    const user = await this.prisma.user.upsert({
      where:  { email: googleUser.email.toLowerCase() },
      update: {
        firstName: googleUser.firstName,
        lastName:  googleUser.lastName,
        avatarUrl: googleUser.avatarUrl,
      },
      create: {
        email:      googleUser.email.toLowerCase(),
        firstName:  googleUser.firstName,
        lastName:   googleUser.lastName,
        avatarUrl:  googleUser.avatarUrl,
        isVerified: true, // Google already verified the email
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return { user, ...tokens };
  }

  // ─── Refresh tokens ────────────────────────

  async refreshTokens(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ─── Get current user ──────────────────────

  async getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:         true,
        email:      true,
        firstName:  true,
        lastName:   true,
        avatarUrl:  true,
        phone:      true,
        role:       true,
        isVerified: true,
        createdAt:  true,
      },
    });
  }

  // ─── Private: generate both tokens ─────────

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    // generate both tokens at the same time for speed
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret:this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn:this.config.getOrThrow<string>('JWT_EXPIRES_IN') as any,
      }),
      this.jwt.signAsync(payload, {
        secret:this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn:this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}