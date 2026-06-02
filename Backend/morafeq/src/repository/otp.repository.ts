import { Injectable } from '@nestjs/common';
import { OTP, OTPTypes } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOtpInput {
  otp: string;
  userId: number;
  expiresAt?: Date;
  otpTypes: OTPTypes;
}

export interface IOtpRepository {
  create(data: CreateOtpInput): Promise<OTP>;
}

@Injectable()
export class OtpRepository implements IOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({otp , expiresAt , otpTypes , userId}: CreateOtpInput): Promise<OTP> {
    return this.prisma.oTP.create({
      data: {
        otp,
        userId,
        expiresAt: expiresAt || new Date(Date.now()+1000*60*10),
        otpTypes,
      },
    });
  }
  
}