import { PrismaClient } from '@prisma/client';
import { applyLocationAlias } from '../src/ai/location-normalization';

const prisma = new PrismaClient();

function canonical(value: string) {
  return applyLocationAlias(value) ?? value;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      city: true,
      governorate: true,
    },
    orderBy: { id: 'asc' },
  });

  let updatedListings = 0;
  const listingCityChanges: Array<{ before: string; after: string }> = [];
  const listingGovernorateChanges: Array<{ before: string; after: string }> = [];

  for (const listing of listings) {
    const city = canonical(listing.city);
    const governorate = canonical(listing.governorate);

    if (city !== listing.city || governorate !== listing.governorate) {
      if (dryRun) {
        if (city !== listing.city) {
          listingCityChanges.push({ before: listing.city, after: city });
        }
        if (governorate !== listing.governorate) {
          listingGovernorateChanges.push({ before: listing.governorate, after: governorate });
        }
      } else {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { city, governorate },
        });
      }
      updatedListings++;
    }
  }

  const areas = await prisma.area.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      governorate: true,
    },
    orderBy: { id: 'asc' },
  });

  let updatedAreas = 0;
  const areaNameChanges: Array<{ before: string; after: string }> = [];
  const areaCityChanges: Array<{ before: string; after: string }> = [];
  const areaGovernorateChanges: Array<{ before: string; after: string }> = [];

  for (const area of areas) {
    const name = canonical(area.name);
    const city = canonical(area.city);
    const governorate = canonical(area.governorate);

    if (
      name !== area.name ||
      city !== area.city ||
      governorate !== area.governorate
    ) {
      if (dryRun) {
        if (name !== area.name) {
          areaNameChanges.push({ before: area.name, after: name });
        }
        if (city !== area.city) {
          areaCityChanges.push({ before: area.city, after: city });
        }
        if (governorate !== area.governorate) {
          areaGovernorateChanges.push({ before: area.governorate, after: governorate });
        }
      } else {
        await prisma.area.update({
          where: { id: area.id },
          data: { name, city, governorate },
        });
      }
      updatedAreas++;
    }
  }

  if (dryRun) {
    console.log('=== DRY RUN RESULTS ===');
    console.log(`\nlistings.city: ${listingCityChanges.length} rows would change`);
    if (listingCityChanges.length > 0) {
      console.log('Sample changes (first 5):');
      listingCityChanges.slice(0, 5).forEach(change => {
        console.log(`  "${change.before}" → "${change.after}"`);
      });
    }

    console.log(`\nlistings.governorate: ${listingGovernorateChanges.length} rows would change`);
    if (listingGovernorateChanges.length > 0) {
      console.log('Sample changes (first 5):');
      listingGovernorateChanges.slice(0, 5).forEach(change => {
        console.log(`  "${change.before}" → "${change.after}"`);
      });
    }

    console.log(`\nareas.name: ${areaNameChanges.length} rows would change`);
    if (areaNameChanges.length > 0) {
      console.log('Sample changes (first 5):');
      areaNameChanges.slice(0, 5).forEach(change => {
        console.log(`  "${change.before}" → "${change.after}"`);
      });
    }

    console.log(`\nareas.city: ${areaCityChanges.length} rows would change`);
    if (areaCityChanges.length > 0) {
      console.log('Sample changes (first 5):');
      areaCityChanges.slice(0, 5).forEach(change => {
        console.log(`  "${change.before}" → "${change.after}"`);
      });
    }

    console.log(`\nareas.governorate: ${areaGovernorateChanges.length} rows would change`);
    if (areaGovernorateChanges.length > 0) {
      console.log('Sample changes (first 5):');
      areaGovernorateChanges.slice(0, 5).forEach(change => {
        console.log(`  "${change.before}" → "${change.after}"`);
      });
    }

    console.log(`\nTotal: listings=${updatedListings}, areas=${updatedAreas} would be updated`);
    console.log('NO CHANGES WERE APPLIED (dry-run mode)');
  } else {
    console.log(
      `Location normalization backfill complete. listings=${updatedListings}, areas=${updatedAreas}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
