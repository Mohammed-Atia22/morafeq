/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Register ────────────────────────────

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    // put refresh token in cookie — JS cannot read this
    this.setRefreshCookie(res, result.refreshToken);

    // only send access token in response body
    return {
      user:        result.user,
      accessToken: result.accessToken,
    };
  }

  // ─── Login ───────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK) // default is 201, we want 200 for login
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      user:        result.user,
      accessToken: result.accessToken,
    };
  }

  // ─── Get current user ────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard) // protected — requires valid access token
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  // ─── Refresh access token ─────────────────

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(user.sub);
    this.setRefreshCookie(res, result.refreshToken);

    return { accessToken: result.accessToken };
  }

  // ─── Logout ──────────────────────────────

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  // ─── Google OAuth ─────────────────────────

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // guard automatically redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.googleLogin(req.user as any);
    this.setRefreshCookie(res, result.refreshToken);

    // redirect frontend with access token in URL
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`,
    );
  }

  // ─── Private helper ───────────────────────

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,   // JS cannot access this cookie
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path:     '/api/v1/auth/refresh',   // only sent to refresh endpoint
    });
  }
}