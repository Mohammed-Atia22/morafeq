import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    const googlePlaceId = input.googlePlaceId?.trim() || undefined;

    if (googlePlaceId) {
      const areaByPlaceId = await this.prisma.area.findUnique({
        where: { googlePlaceId },
      });

      if (areaByPlaceId) {
        return areaByPlaceId;
      }
    }

    const existingArea = await this.prisma.area.findFirst({
      where: {
        name: input.name,
        city: input.city,
        governorate: input.governorate,
        country,
      },
    });

    if (existingArea) {
      if (googlePlaceId && !existingArea.googlePlaceId) {
        try {
          return await this.prisma.area.update({
            where: { id: existingArea.id },
            data: { googlePlaceId },
          });
        } catch (error) {
          if (this.isUniqueConstraintError(error)) {
            const areaByPlaceId = await this.prisma.area.findUnique({
              where: { googlePlaceId },
            });

            return areaByPlaceId ?? existingArea;
          }

          throw error;
        }
      }

      return existingArea;
    }

    try {
      return await this.prisma.area.create({
        data: {
          name: input.name,
          city: input.city,
          governorate: input.governorate,
          country,
          googlePlaceId,
        },
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }

      if (googlePlaceId) {
        const areaByPlaceId = await this.prisma.area.findUnique({
          where: { googlePlaceId },
        });

        if (areaByPlaceId) {
          return areaByPlaceId;
        }
      }

      const areaByLocation = await this.prisma.area.findFirst({
        where: {
          name: input.name,
          city: input.city,
          governorate: input.governorate,
          country,
        },
      });

      if (areaByLocation) {
        return areaByLocation;
      }

      throw error;
    }
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
