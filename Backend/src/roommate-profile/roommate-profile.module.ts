import { Module } from '@nestjs/common';
import { RoommateProfileService } from './roommate-profile.service';
import { RoommateProfileController } from './roommate-profile.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoommateProfileController],
  providers: [RoommateProfileService],
  exports: [RoommateProfileService],
})
export class RoommateProfileModule {}