import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { AreasModule } from 'src/areas/areas.module';
import { LocationInsightsModule } from './../location-insights/location-insights.module';

@Module({
  imports: [UploadsModule,AreasModule,LocationInsightsModule],
providers: [ListingsService],
  controllers: [ListingsController],
  exports: [ListingsService],
})
export class ListingsModule {}