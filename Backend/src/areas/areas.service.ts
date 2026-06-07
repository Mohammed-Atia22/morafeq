import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FindOrCreateAreaInput = {
  name: string;
  city: string;
  governorate: string;
  country?: string;
  googlePlaceId?: string;
};

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateArea(input: FindOrCreateAreaInput) {
    const country = input.country ?? 'Egypt';

    const existingArea = await this.prisma.area.findFirst({
      where: {
        name: input.name,
        city: input.city,
        governorate: input.governorate,
        country,
      },
    });

    if (existingArea) {
      return existingArea;
    }

    return this.prisma.area.create({
      data: {
        name: input.name,
        city: input.city,
        governorate: input.governorate,
        country,
        googlePlaceId: input.googlePlaceId,
      },
    });
  }
}