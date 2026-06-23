/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { VerificationModule } from './verification/verification.module';
import { DisputeChatModule } from './dispute-chat/dispute-chat.module';
// import { AiModule } from './ai/ai.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RoommateProfileModule } from './roommate-profile/roommate-profile.module';
import { RoommateMatchingModule } from './roommate-matching/roommate-matching.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    MessagesModule,
    UploadsModule,
    SearchModule,
    LocationsModule,
    AreasModule,
    LocationInsightsModule,
    AdminModule,
    ChatModule,
    VerificationModule,
    DisputeChatModule,
    // AiModule,
    FavoritesModule,
    NotificationsModule,
    RoommateProfileModule,
    RoommateMatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
