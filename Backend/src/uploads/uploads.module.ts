import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [UploadsService],
  exports:   [UploadsService],  // export so UsersModule can use it
})
export class UploadsModule {}