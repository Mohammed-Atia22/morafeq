import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AreasService } from './areas.service';

@Module({
  imports: [PrismaModule],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}
