import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cities = await prisma.listing.findMany({ select: { city: true }, distinct: ['city'] });
  const governorates = await prisma.listing.findMany({ select: { governorate: true }, distinct: ['governorate'] });
  const areaNames = await prisma.area.findMany({ select: { name: true }, distinct: ['name'] });
  const areaCities = await prisma.area.findMany({ select: { city: true }, distinct: ['city'] });
  const areaGovernorates = await prisma.area.findMany({ select: { governorate: true }, distinct: ['governorate'] });

  console.log(JSON.stringify({ cities, governorates, areaNames, areaCities, areaGovernorates }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });