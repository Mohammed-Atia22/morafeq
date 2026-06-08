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
  Patch,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  confirmrDto,
  forgetDto,
  RegisterDto,
  ResendOtpDto,
  resetDto,
} from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CompleteOnboardingDto } from './dto/onboarding.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Register ────────────────────────────

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  // ─── Confirm OTP ─────────────────────────

  @Patch('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() body: confirmrDto) {
    return this.authService.confirm(body);
  }

  // ─── Login ───────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  // ─── Forget password ──────────────────────

  @Patch('forgetPassword')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body() body: forgetDto) {
    return this.authService.forgetPassword(body);
  }

  // ─── Reset password ───────────────────────

  @Patch('resetPassword')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: resetDto) {
    return this.authService.resetPassword(body);
  }

  // ─── Resend OTP ───────────────────────────

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendOtp(body);
  }

  // ─── Get current user ────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  // ─── Refresh token ────────────────────────

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
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user as any);
    this.setRefreshCookie(res, result.refreshToken);

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`,
    );
  }

  // ─── Complete onboarding ──────────────────

  @Patch('onboarding')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  completeOnboarding(
    @Req() req: Request & { user: { id: number } },
    @Body() body: CompleteOnboardingDto,
  ) {
    return this.authService.completeOnboarding(req.user.id, body.role);
  }

  // ─── Private helper ───────────────────────

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });
  }
}