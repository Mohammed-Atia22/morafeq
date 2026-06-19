import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DisputeChatController } from './dispute-chat.controller';
import { DisputeChatService } from './dispute-chat.service';

@Module({
  imports: [PrismaModule],

  controllers: [DisputeChatController],

  providers: [DisputeChatService],

  exports: [DisputeChatService],
})
export class DisputeChatModule {}