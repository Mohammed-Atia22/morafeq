/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  confirmrDto,
  forgetDto,
  RegisterDto,
  ResendOtpDto,
  ResetOtpDto,
  resetDto,
} from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
import * as crypto from 'crypto';
import { sendEmail } from 'src/common/emails/sendEmail';
import { OtpRepository } from 'src/repository/otp.repository';
import { OTPTypes, UserRole, VerificationStatus } from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable()
export class AuthService {
  private readonly resendCooldownMs = 60 * 1000;
  private readonly otpLockMs = 60 * 60 * 1000;
  private readonly maxOtpAttempts = 5;
  private readonly resendCooldowns = new Map<string, number>();
  private readonly otpAttemptState = new Map<
    string,
    { attempts: number; blockedUntil?: number }
  >();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private readonly OtpRepository: OtpRepository,
  ) {}

  // ─── Register ──────────────────────────────

  async register(body: RegisterDto) {
  try {
    const { firstName, lastName, email, phone, password, gender } = body;

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find existing user by email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Verified account cannot register again
    if (existingUser?.isVerified) {
      throw new ConflictException('هذا البريد الإلكتروني مسجل بالفعل');
    }

    // 2. Validate and normalize phone
    const phoneNumber = parsePhoneNumberFromString(phone.trim());

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new BadRequestException('ادخل رقم هاتف صحيح');
    }

    const normalizedPhone = phoneNumber.number;
    const phoneCountry = phoneNumber.country ?? null;
    const phoneCountryCode = `+${phoneNumber.countryCallingCode}`;

    const phoneCryptoSecret =
      process.env.PHONE_CRYPTO_SECRET ?? 'dev_phone_crypto_secret';

    const phoneHashSecret =
      process.env.PHONE_HASH_SECRET ?? 'dev_phone_hash_secret';

    const encryptedPhone = CryptoJS.AES.encrypt(
      normalizedPhone,
      phoneCryptoSecret,
    ).toString();

    const phoneHash = CryptoJS.HmacSHA256(
      normalizedPhone,
      phoneHashSecret,
    ).toString();

    // 3. Check phone uniqueness, excluding the same unverified user
    const existingPhone = await this.prisma.user.findFirst({
      where: {
        phoneHash,
        ...(existingUser
          ? {
              id: {
                not: existingUser.id,
              },
            }
          : {}),
      },
    });

    if (existingPhone) {
      if (existingPhone.isVerified) {
        throw new ConflictException(
          'رقم الهاتف مسجل بالفعل',
        );
      }

      await this.prisma.user.delete({
        where: {
          id: existingPhone.id,
        },
      });
    }

    // 4. Hash password
    const saltRounds = Number(process.env.SaltRound ?? 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Create new user or update the existing unverified user
    const user = existingUser
      ? await this.prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            passwordHash,
            firstName,
            lastName,
            gender,
            phone: encryptedPhone,
            phoneCountry,
            phoneCountryCode,
            phoneHash,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            gender: true,
            createdAt: true,
          },
        })
      : await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            firstName,
            lastName,
            gender,
            phone: encryptedPhone,
            phoneCountry,
            phoneCountryCode,
            phoneHash,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            gender: true,
            createdAt: true,
          },
        });

    // 6. Generate OTP
    const code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const codeHash = await bcrypt.hash(code, saltRounds);

    // Remove any previous email-confirmation OTPs
    await this.prisma.oTP.deleteMany({
      where: {
        userId: user.id,
        otpTypes: OTPTypes.EMAIL_CONFIRMATION,
      },
    });

    // Create the latest OTP
    await this.OtpRepository.create({
      otp: codeHash,
      userId: user.id,
      otpTypes: OTPTypes.EMAIL_CONFIRMATION,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (process.env.DISABLE_EMAILS === 'true') {
  console.log(`DEV OTP for ${normalizedEmail}: ${code}`);
} else {
  await sendEmail({
    to: normalizedEmail,
    subject: 'Confirm your email',
    html: `
      <h1>Your verification code: ${code}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

this.markOtpSent(normalizedEmail, OTPTypes.EMAIL_CONFIRMATION);


    return {
      message: existingUser
        ? 'A new verification code has been sent to your email.'
        : 'Account created successfully. Please check your email for the verification code.',
      user,
    };
  } catch (error) {
  console.error('REGISTER ERROR:', error);

  if (error instanceof HttpException) {
    throw error;
  }

  throw new InternalServerErrorException(
    'فشل إنشاء الحساب. حاول مرة أخرى.',
  );
}
}

  // ─── Confirm OTP ───────────────────────────

  async confirm(body: confirmrDto) {
    const { email, otp } = body;
    const normalizedEmail = email.toLowerCase();
    const attemptKey = this.getOtpAttemptKey(
      normalizedEmail,
      OTPTypes.EMAIL_CONFIRMATION,
    );

    this.assertOtpAttemptsAllowed(attemptKey);

    // 1. find unverified user
    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isVerified: false,
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'Email does not exist or is already verified',
      );
    }

    // 2. find latest OTP
    const otpExist = await this.prisma.oTP.findFirst({
      where: {
        userId: user.id,
        otpTypes: OTPTypes.EMAIL_CONFIRMATION,
      },
      orderBy: { id: 'desc' },
    });

    if (!otpExist) {
      throw new ForbiddenException(
        'انتهت صلاحية رمز التحقق لمرة واحدة. يرجى طلب رمز جديد.',
      );
    }

    // 3. check expiry first
    if (new Date() > otpExist.expiresAt) {
      await this.prisma.oTP.delete({ where: { id: otpExist.id } });
      throw new ForbiddenException(
        'انتهت صلاحية رمز التحقق لمرة واحدة. يرجى طلب رمز جديد.',
      );
    }

    // 4. compare OTP
    const otpCompare = await bcrypt.compare(otp, otpExist.otp);

    if (!otpCompare) {
      this.recordFailedOtpAttempt(attemptKey);
      throw new ForbiddenException('رمز التحقق غير صحيح');
    }

    this.clearOtpAttempts(attemptKey);

    // 5. verify user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // 6. delete used OTP
    await this.prisma.oTP.delete({ where: { id: otpExist.id } });

    // 7. generate tokens
    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    );

    return {
      message: 'Email verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        onboardingCompleted: updatedUser.onboardingCompleted,
      },
      ...tokens,
    };
  }

  // ─── Login ─────────────────────────────────

  async login(dto: LoginDto) {
    // 1. find verified user
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        isVerified: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // 2. check if Google-only account
    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses Google login. Please sign in with Google.',
      );
    }

    // 3. verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
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
    const user = await this.prisma.user.upsert({
      where: { email: googleUser.email.toLowerCase() },
      update: {
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        avatarUrl: googleUser.avatarUrl,
      },
      create: {
        email: googleUser.email.toLowerCase(),
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        avatarUrl: googleUser.avatarUrl,
        isVerified: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
      ...tokens,
    };
  }

  // ─── Refresh tokens ────────────────────────

  async refreshTokens(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ─── Get current user ──────────────────────

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        phoneCountry: true,
        phoneCountryCode: true,
        bio: true,
        role: true,
        gender: true,
        isVerified: true,
        verificationStatus: true,
        trustScore: true,
        onboardingCompleted: true,
        createdAt: true,
        passwordHash: true,
        verification: {
          select: {
            status: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentVerificationStatus =
      user.verification?.status ?? VerificationStatus.NOT_STARTED;

    if (currentVerificationStatus !== user.verificationStatus) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: currentVerificationStatus },
      });

      user.verificationStatus = currentVerificationStatus;
    }

    // decrypt phone for display
    let decryptedPhone: string | null = null;

    if (user.phone) {
      const phoneCryptoSecret =
        process.env.PHONE_CRYPTO_SECRET ?? 'dev_phone_crypto_secret';

      decryptedPhone = CryptoJS.AES.decrypt(
        user.phone,
        phoneCryptoSecret,
      ).toString(CryptoJS.enc.Utf8);
    }

    return {
      ...user,
      phone: decryptedPhone,
    };
  }

  // ─── Forget password ───────────────────────

  async forgetPassword(body: forgetDto) {
    try {
      const { email } = body;

      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new ForbiddenException(
          'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني',
        );
      }

      this.assertResendAllowed(email.toLowerCase(), OTPTypes.RESET_PASSWORD);

      const saltRounds = Number(process.env.SaltRound ?? 12);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, saltRounds);

      await this.OtpRepository.create({
        otp: codeHash,
        userId: user.id,
        otpTypes: OTPTypes.RESET_PASSWORD,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      await sendEmail({
        to: email,
        subject: 'Password Reset Code',
        html: `<h1>Your password reset code: ${code}</h1><p>This code expires in 10 minutes.</p>`,
      });

      this.markOtpSent(email.toLowerCase(), OTPTypes.RESET_PASSWORD);

      return { message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  // ─── Reset password ────────────────────────

  async resetPassword(body: resetDto) {
    try {
      const { email, otp, newPassword, confirmPassword } = body;
      const normalizedEmail = email.toLowerCase();
      const attemptKey = this.getOtpAttemptKey(
        normalizedEmail,
        OTPTypes.RESET_PASSWORD,
      );

      this.assertOtpAttemptsAllowed(attemptKey);

      // 1. check passwords match
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('كلمتا المرور غير متطابقتين');
      }

      // 2. find user
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new ForbiddenException(
          'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني',
        );
      }

      // 3. find latest reset OTP
      const otpExist = await this.prisma.oTP.findFirst({
        where: {
          userId: user.id,
          otpTypes: OTPTypes.RESET_PASSWORD,
        },
        orderBy: { id: 'desc' },
      });

      if (!otpExist) {
        throw new ForbiddenException(
          'لم يتم إرسال رمز التحقق أو انتهت صلاحيته. اطلب رمزًا جديدًا.',
        );
      }

      // 4. check expiry
      if (new Date() > otpExist.expiresAt) {
        await this.prisma.oTP.delete({ where: { id: otpExist.id } });
        throw new ForbiddenException(
          'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.',
        );
      }

      // 5. compare OTP
      const otpCompare = await bcrypt.compare(otp, otpExist.otp);

      if (!otpCompare) {
        this.recordFailedOtpAttempt(attemptKey);
        throw new ForbiddenException('رمز التحقق غير صحيح');
      }

      this.clearOtpAttempts(attemptKey);

      // 6. hash and save new password
      const saltRounds = Number(process.env.SaltRound ?? 12);
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // 7. delete used OTP
      await this.prisma.oTP.delete({ where: { id: otpExist.id } });

      return {
        message:
          'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة.',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  async verifyResetOtp(body: ResetOtpDto) {
    const { email, otp } = body;
    const normalizedEmail = email.toLowerCase();
    const attemptKey = this.getOtpAttemptKey(
      normalizedEmail,
      OTPTypes.RESET_PASSWORD,
    );

    this.assertOtpAttemptsAllowed(attemptKey);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new ForbiddenException(
        'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني',
      );
    }

    const otpExist = await this.prisma.oTP.findFirst({
      where: {
        userId: user.id,
        otpTypes: OTPTypes.RESET_PASSWORD,
      },
      orderBy: { id: 'desc' },
    });

    if (!otpExist) {
      throw new ForbiddenException(
        'لم يتم إرسال رمز التحقق أو انتهت صلاحيته. اطلب رمزًا جديدًا.',
      );
    }

    if (new Date() > otpExist.expiresAt) {
      await this.prisma.oTP.delete({ where: { id: otpExist.id } });
      throw new ForbiddenException(
        'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.',
      );
    }

    const otpCompare = await bcrypt.compare(otp, otpExist.otp);

    if (!otpCompare) {
      this.recordFailedOtpAttempt(attemptKey);
      throw new ForbiddenException('رمز التحقق غير صحيح');
    }

    this.clearOtpAttempts(attemptKey);

    return { message: 'تم التحقق من الرمز بنجاح' };
  }

  // ─── Resend OTP ────────────────────────────

  async resendOtp(body: ResendOtpDto) {
    const { email } = body;
    const normalizedEmail = email.toLowerCase();

    this.assertResendAllowed(normalizedEmail, OTPTypes.EMAIL_CONFIRMATION);

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isVerified: false,
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'Email does not exist or is already verified',
      );
    }

    // delete all old email confirmation OTPs for this user
    await this.prisma.oTP.deleteMany({
      where: {
        userId: user.id,
        otpTypes: OTPTypes.EMAIL_CONFIRMATION,
      },
    });

    const saltRounds = Number(process.env.SaltRound ?? 12);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, saltRounds);

    await this.OtpRepository.create({
      otp: codeHash,
      userId: user.id,
      otpTypes: OTPTypes.EMAIL_CONFIRMATION,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendEmail({
      to: email,
      subject: 'New Verification Code',
      html: `<h1>Your new verification code: ${code}</h1><p>This code expires in 10 minutes.</p>`,
    });

    this.markOtpSent(normalizedEmail, OTPTypes.EMAIL_CONFIRMATION);

    return { message: 'New verification code sent to your email' };
  }

  // ─── Complete onboarding ───────────────────

  async completeOnboarding(userId: number, role: UserRole) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        onboardingCompleted: true,
      },
    });

    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    );

    return {
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        onboardingCompleted: updatedUser.onboardingCompleted,
      },
      ...tokens,
    };
  }

  // ─── Private: generate tokens ──────────────

  private async generateTokens(userId: number, email: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      pwdv: this.passwordFingerprint(user?.passwordHash ?? null),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN') as any,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private passwordFingerprint(passwordHash?: string | null) {
    const secret = this.config.get<string>('JWT_SECRET') ?? 'dev_jwt_secret';

    return crypto
      .createHmac('sha256', secret)
      .update(passwordHash ?? 'NO_PASSWORD')
      .digest('hex')
      .slice(0, 32);
  }

  private getOtpAttemptKey(email: string, otpType: OTPTypes) {
    return `${otpType}:${email.toLowerCase()}`;
  }

  private getResendCooldownKey(email: string, otpType: OTPTypes) {
    return `${otpType}:${email.toLowerCase()}`;
  }

  private assertResendAllowed(email: string, otpType: OTPTypes) {
    const key = this.getResendCooldownKey(email, otpType);
    const lastSentAt = this.resendCooldowns.get(key);

    if (lastSentAt && Date.now() - lastSentAt < this.resendCooldownMs) {
      throw new HttpException(
        'انتظر دقيقة واحدة قبل طلب الرمز.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private markOtpSent(email: string, otpType: OTPTypes) {
    this.resendCooldowns.set(
      this.getResendCooldownKey(email, otpType),
      Date.now(),
    );
  }

  private assertOtpAttemptsAllowed(key: string) {
    const state = this.otpAttemptState.get(key);

    if (state?.blockedUntil && state.blockedUntil > Date.now()) {
      throw new HttpException(
        'عدد المحاولات كبير جدًا\nيمكنك المحاولة مرة أخرى بعد ساعة',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (state?.blockedUntil && state.blockedUntil <= Date.now()) {
      this.otpAttemptState.delete(key);
    }
  }

  private recordFailedOtpAttempt(key: string) {
    const current = this.otpAttemptState.get(key) ?? { attempts: 0 };
    const attempts = current.attempts + 1;

    if (attempts >= this.maxOtpAttempts) {
      this.otpAttemptState.set(key, {
        attempts,
        blockedUntil: Date.now() + this.otpLockMs,
      });

      throw new HttpException(
        'عدد المحاولات كبير جدًا\nيمكنك المحاولة مرة أخرى بعد ساعة',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.otpAttemptState.set(key, { attempts });
  }

  private clearOtpAttempts(key: string) {
    this.otpAttemptState.delete(key);
  }
}
