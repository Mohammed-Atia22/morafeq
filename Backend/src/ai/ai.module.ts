import { Module } from '@nestjs/common';
import { RagService } from './ai.service';
import { RagController } from './ai.controller';
import { LocationInsightsModule } from '../location-insights/location-insights.module';
import { RoommateMatchingModule } from 'src/roommate-matching/roommate-matching.module';

@Module({
  imports: [LocationInsightsModule,RoommateMatchingModule,],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class AiModule {}
