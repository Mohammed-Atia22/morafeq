import { Module } from '@nestjs/common';
import { RagService } from './ai.service';
import { RagController } from './ai.controller';
import { LocationInsightsModule } from '../location-insights/location-insights.module';

@Module({
  imports: [LocationInsightsModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class AiModule {}
