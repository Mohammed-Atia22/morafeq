import { NestFactory } from '@nestjs/core';
import { ListingStatus } from '@prisma/client';

import { AppModule } from '../src/app.module';
import { RagService } from '../src/ai/ai.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const prisma = app.get(PrismaService);
  const ragService = app.get(RagService);

  try {
    const searchableListings = await prisma.listing.findMany({
      where: {
        status: {
          in: [ListingStatus.ACTIVE, ListingStatus.APPROVED],
        },
        isDeleted: false,
      },
      select: {
        id: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    console.log(
      `Found ${searchableListings.length} active/approved listing(s) to index.`,
    );

    let processed = 0;
    let failed = 0;

    for (const listing of searchableListings) {
      console.log(`Syncing listing ${listing.id}...`);

      try {
        await ragService.syncListingToVectorDB(listing.id);
        processed++;
        console.log(`✓ Listing ${listing.id} indexed`);
      } catch (error) {
        failed++;
        console.error(`✗ Failed listing ${listing.id}`);
        console.error(error);
      }
    }

    console.log(
      `Backfill complete. processed=${processed}, failed=${failed}`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Backfill failed.');
  console.error(error);
  process.exitCode = 1;
});
