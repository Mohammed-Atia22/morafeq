import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from './../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
  PrismaModule,
    NotificationsModule,
    AiModule,
  ],
  controllers: [AdminController],
  providers:   [AdminService],
  exports:     [AdminService],
})
export class AdminModule {}
