import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UploadsModule,  // for S3 upload
    AuthModule,     // for refreshTokens in becomeHost
  ],
  providers:   [UsersService],
  controllers: [UsersController],
  exports:     [UsersService],
})
export class UsersModule {}