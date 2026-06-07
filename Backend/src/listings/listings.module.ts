import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AreasModule } from '../areas/areas.module';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

@Module({
  imports: [PrismaModule, AreasModule],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
