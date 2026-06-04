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
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { confirmrDto, forgetDto, RegisterDto, ResendOtpDto, resetDto } from './dto/register.dto';
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
  @UsePipes(new ValidationPipe())
  async register(
    @Body() body:RegisterDto,
  ) {

    return this.authService.register(body)
  }


  // ─── confirm otp ────────────────────────────

  @Patch('confirm')
  @UsePipes(new ValidationPipe())
  async confirm(
    @Body() body:confirmrDto,
  ) {

    return this.authService.confirm(body)
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
      user: result.user,
      accessToken: result.accessToken,
    };
  }



  @Patch('forgetPassword')
  @HttpCode(HttpStatus.OK) 
  @UsePipes(new ValidationPipe())
  async forgetPassword(
    @Body() body: forgetDto,
  ) {
    return this.authService.forgetPassword(body)
  }


  @Patch('resetPassword')
  @HttpCode(HttpStatus.OK) 
  @UsePipes(new ValidationPipe())
  async resetPassword(
    @Body() body: resetDto,
  ) {
    return this.authService.resetPassword(body)
  }



@Post('resend-otp')
@UsePipes(new ValidationPipe())
resendOtp(@Body() body: ResendOtpDto) {
  return this.authService.resendOtp(body);
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
  async googleCallback(@Req() req: Request, @Res() res: Response) {
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
      httpOnly: true, // JS cannot access this cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/api/v1/auth/refresh', // only sent to refresh endpoint
    });
  }


  @Patch('onboarding')
@UseGuards(JwtAuthGuard)
completeOnboarding(
  @Req() req: Request & { user: { id: number } },
  @Body() body: CompleteOnboardingDto,
) {
  return this.authService.completeOnboarding(req.user.id , body.role);
}
}



