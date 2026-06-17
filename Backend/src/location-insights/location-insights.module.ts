import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationInsightsService } from './location-insights.service';
import { LocationInsightsController } from './location-insights.controller';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 20000,
    }),
  ],
  controllers: [LocationInsightsController],
  providers: [LocationInsightsService],
  exports: [LocationInsightsService],
})
export class LocationInsightsModule {}
