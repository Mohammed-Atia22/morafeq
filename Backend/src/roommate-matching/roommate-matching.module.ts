import { Module } from '@nestjs/common';
import { RoommateMatchingService } from './roommate-matching.service';
import { RoommateMatchingController } from './roommate-matching.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoommateMatchingController],
  providers: [RoommateMatchingService],
  exports: [RoommateMatchingService],
})
export class RoommateMatchingModule {}