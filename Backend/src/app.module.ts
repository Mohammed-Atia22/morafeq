/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './uploads/uploads.module';
import { SearchModule } from './search/search.module';
import { LocationsModule } from './locations/locations.module';
import { AreasModule } from './areas/areas.module';
import { LocationInsightsModule } from './location-insights/location-insights.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ListingsModule, BookingsModule, PaymentsModule, 
    ReviewsModule, MessagesModule, UploadsModule, SearchModule, LocationsModule, AreasModule, LocationInsightsModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
