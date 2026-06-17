import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [PrismaModule, UploadsModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
