import { Module } from '@nestjs/common';
import { RagService } from './ai.service';
import { RagController } from './ai.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[HttpModule],
  controllers: [RagController],
  providers:   [RagService],
  exports:     [RagService],
})
export class AiModule {}