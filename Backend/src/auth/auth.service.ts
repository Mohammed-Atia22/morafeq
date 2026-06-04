/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { confirmrDto, forgetDto, RegisterDto, ResendOtpDto, resetDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
import { sendEmail } from 'src/common/emails/sendEmail';
import { OtpRepository } from 'src/repository/otp.repository';
import { OTPTypes , UserRole} from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable()
export class AuthService {
  constructor(
    private prisma:  PrismaService,
    private jwt:     JwtService,
    private config:  ConfigService,
    private readonly OtpRepository:OtpRepository
  ) {}

  // ─── Register ──────────────────────────────

  async register(body: RegisterDto) {

    try {
      const {firstName , lastName , email , phone , password , gender} = body
    // 1. check email not already used
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('This email is already registered');
    }
    const saltRounds = Number(process.env.SaltRound ?? 12);
    const passwordHash = await bcrypt.hash(password, saltRounds );
    const phoneNumber = parsePhoneNumberFromString(phone);

if (!phoneNumber || !phoneNumber.isValid()) {
  throw new BadRequestException('Invalid phone number');
}

const normalizedPhone = phoneNumber.number; // e.g. +2015505543028
const phoneCountry = phoneNumber.country ?? null; // e.g. EG
const phoneCountryCode = phoneNumber.countryCallingCode; // e.g. 20

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


const existingPhone = await this.prisma.user.findUnique({
  where: {
    phoneHash,
  },
});

if (existingPhone) {
  throw new ConflictException('This phone number is already registered');
}
    
    const user = await this.prisma.user.create({
      data: {
        email:        email.toLowerCase(),
        passwordHash,
        firstName:    firstName,
        lastName:     lastName,
        gender,
        phone: encryptedPhone,
    phoneCountry,
    phoneCountryCode,
    phoneHash,
      },
      // only return these fields — never return passwordHash
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        role:      true,
        gender:    true,
        createdAt: true,
      },
    });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, saltRounds );
   await this.OtpRepository.create({
      otp:codeHash,
      userId:user.id,
      otpTypes:OTPTypes.EMAIL_CONFIRMATION

    })
    await sendEmail({to:email , subject:"confirm OTP" , html:`<h1>code : ${code}</h1>`})
    

    return { 
      message:"the account is created",
      user };
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }
  // ─── confirmation ──────────────────────────────

 async confirm(body: confirmrDto) {
  try {
    const { email, otp } = body;

  const user = await this.prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      isVerified: false,
    },
  });

  if (!user) {
    throw new ForbiddenException('Email does not exist or is already verified');
  }

  
  const otpExist = await this.prisma.oTP.findFirst({
    where: {
      userId: user.id,
      otpTypes: OTPTypes.EMAIL_CONFIRMATION,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (!otpExist) {
    throw new ForbiddenException( 'OTP does not exist');
  }

  // 3. Check expiry first
  if (new Date() > otpExist.expiresAt) {
    await this.prisma.oTP.delete({
      where: {
        id: otpExist.id,
      },
    });

    throw new ForbiddenException('OTP is expired');
  }

  // 4. Compare OTP
  const otpCompare = await bcrypt.compare(otp, otpExist.otp);

  if (!otpCompare) {
    throw new ForbiddenException('OTP is not correct');
  }

  // 5. Verify user
  const updatedUser = await this.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isVerified: true,
    },
  });

  // 6. Delete OTP after successful verification
  await this.prisma.oTP.delete({
    where: {
      id: otpExist.id,
    },
  });

  // 7. Generate tokens
  const tokens = await this.generateTokens(
    updatedUser.id,
    updatedUser.email,
    updatedUser.role,
  );

  return {
    message: 'Email verified successfully',
    ...tokens,
  };
  } catch (error) {
    return {error}
  }
}



  // ─── Login ─────────────────────────────────

  async login(dto: LoginDto) {
    // 1. find user
    const user = await this.prisma.user.findUnique({
      where: { 
        email: dto.email.toLowerCase(),
        isVerified:true
      },
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
      throw new UnauthorizedException('Invalid Password');
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
    phone?: string;
  }) {
    // upsert = update if exists, create if not
    const user = await this.prisma.user.upsert({
      where:  { email: googleUser.email.toLowerCase() },
      update: {
        firstName: googleUser.firstName,
        lastName:  googleUser.lastName,
        avatarUrl: googleUser.avatarUrl,
        phone:googleUser.phone
      },
      create: {
        email:      googleUser.email.toLowerCase(),
        firstName:  googleUser.firstName,
        lastName:   googleUser.lastName,
        avatarUrl:  googleUser.avatarUrl,
        phone:  googleUser.phone,
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
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

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





// ─── forget Password ──────────────────────────────

  async forgetPassword(body: forgetDto) {

    try {
      const {email  } = body
    // 1. check email not already used
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new ConflictException('This email is not Exsist');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, Number(process.env.SaltRound) );
    await this.OtpRepository.create({
      otp:codeHash,
      userId:user.id,
      otpTypes:OTPTypes.RESET_PASSWORD

    })
    await sendEmail({to:email , subject:"Forget Password OTP" , html:`<h1>code : ${code}</h1>`})

    return {message:"the Otp is Send"}

    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }



// ─── reset Password ──────────────────────────────

  async resetPassword(body: resetDto) {

    try {
      const {email , otp , newPassword , confirmPassword } = body

      if(newPassword !==confirmPassword){
        throw new ForbiddenException("password is not match")
      }
    // 1. check email not already used
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new ConflictException('This email is not Exsist');
    }
    
    const otpExist = await this.prisma.oTP.findFirst({
    where: {
      userId: user.id,
      otpTypes: OTPTypes.RESET_PASSWORD,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (!otpExist) {
    throw new ForbiddenException( 'OTP does not exist');
  }

  // 3. Check expiry first
  if (new Date() > otpExist.expiresAt) {
    await this.prisma.oTP.delete({
      where: {
        id: otpExist.id,
      },
    });

    throw new ForbiddenException('OTP is expired');
  }

  // 4. Compare OTP
  const otpCompare = await bcrypt.compare(otp, otpExist.otp);

  if (!otpCompare) {
    throw new ForbiddenException('OTP is not correct');
  }
const passwordHash = await bcrypt.hash(newPassword, Number(process.env.SaltRound) );
  // 5. Verify user
   await this.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash
    },
  });

  // 6. Delete OTP after successful verification
  await this.prisma.oTP.delete({
    where: {
      id: otpExist.id,
    },
  });

  return {message:"password is changed success"}

    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }


  async resendOtp(body: ResendOtpDto) {
  const { email } = body;

  const user = await this.prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      isVerified: false,
    },
  });

  if (!user) {
    throw new ForbiddenException('Email does not exist or is already verified');
  }

  // Delete old email confirmation OTPs
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
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: 'Confirm OTP',
    html: `<h1>code : ${code}</h1>`,
  });

  return {
    message: 'OTP resent successfully',
  };
}




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


}



