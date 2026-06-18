import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchListingDto } from '../listings/dto/search-listing.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) { }

  private calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) {
    const earthRadiusKm = 6371;
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private buildWhere(dto: SearchListingDto) {
    const where: any = {
      status: { in: ['ACTIVE', 'APPROVED'] },
      isDeleted: false,
    };

    if (dto.q) {
      where.OR = [
        { title: { contains: dto.q } },
        { description: { contains: dto.q } },
        { city: { contains: dto.q } },
        { governorate: { contains: dto.q } },
        { country: { contains: dto.q } },
        { area: { name: { contains: dto.q } } },
      ];
    }

    if (dto.city) {
      where.city = {
        contains: dto.city,
      };
    }

    if (dto.governorate) {
      where.governorate = {
        contains: dto.governorate,
      };
    }

    if (dto.country) {
      where.country = {
        contains: dto.country,
      };
    }

    if (dto.areaId) {
      where.areaId = dto.areaId;
    }

    if (dto.guests) {
      where.maxTenants = {
        gte: dto.guests,
      };
    }

    if (dto.propertyType) {
      where.propertyType = dto.propertyType;
    }

    if (dto.roomType) {
      where.roomType = dto.roomType;
    }

    if (dto.genderPreference) {
      where.genderPreference = dto.genderPreference;
    }

    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }

    if (dto.minPrice || dto.maxPrice) {
      where.monthlyRent = {};
      if (dto.minPrice) {
        where.monthlyRent.gte = dto.minPrice;
      }
      if (dto.maxPrice) {
        where.monthlyRent.lte = dto.maxPrice;
      }
    }

    if (dto.availableFrom) {
      const availableFromDate = new Date(dto.availableFrom);
      if (!Number.isNaN(availableFromDate.getTime())) {
        where.availableFrom = {
          lte: availableFromDate,
        };
      }
    }

    if (dto.amenities && dto.amenities.length > 0) {
      where.amenities = {
        some: {
          amenityKey: {
            in: dto.amenities,
          },
        },
      };
    }

    return where;
  }

  async searchListings(dto: SearchListingDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(dto);

    const hasNearSearch =
      dto.nearLat !== undefined || dto.nearLng !== undefined;

    if (hasNearSearch) {
      if (dto.nearLat === undefined || dto.nearLng === undefined) {
        throw new BadRequestException(
          'nearLat and nearLng must be provided together',
        );
      }

      const radiusKm = dto.radiusKm ?? 3;

      const allListings = await this.prisma.listing.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          area: true,
          category: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
            },
          },
          photos: {
            where: {
              isCover: true,
            },
            take: 1,
          },
          amenities: true,
          locationInsight: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });

      const listingsWithDistance = allListings
        .map((listing) => {
          const listingLat = Number(listing.lat);
          const listingLng = Number(listing.lng);

          if (
            Number.isNaN(listingLat) ||
            Number.isNaN(listingLng) ||
            listing.lat === null ||
            listing.lng === null
          ) {
            return null;
          }

          const distanceKm = this.calculateDistanceKm(
            dto.nearLat!,
            dto.nearLng!,
            listingLat,
            listingLng,
          );

          return {
            ...listing,
            distanceKm: Number(distanceKm.toFixed(2)),
          };
        })
        .filter((listing) => {
          return listing !== null && listing.distanceKm <= radiusKm;
        });

      if (dto.sortBy === 'price_low' || dto.sortBy === 'price_asc') {
        listingsWithDistance.sort(
          (a, b) => Number(a!.monthlyRent) - Number(b!.monthlyRent),
        );
      } else if (dto.sortBy === 'price_high' || dto.sortBy === 'price_desc') {
        listingsWithDistance.sort(
          (a, b) => Number(b!.monthlyRent) - Number(a!.monthlyRent),
        );
      } else {
        listingsWithDistance.sort((a, b) => a!.distanceKm - b!.distanceKm);
      }

      const total = listingsWithDistance.length;
      const paginatedListings = listingsWithDistance.slice(skip, skip + limit);

      return {
        data: paginatedListings,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    let orderBy: any = {
      createdAt: 'desc',
    };

    if (dto.sortBy === 'price_low' || dto.sortBy === 'price_asc') {
      orderBy = {
        monthlyRent: 'asc',
      };
    }

    if (dto.sortBy === 'price_high' || dto.sortBy === 'price_desc') {
      orderBy = {
        monthlyRent: 'desc',
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          area: true,
          category: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
            },
          },
          photos: {
            where: {
              isCover: true,
            },
            take: 1,
          },
          amenities: true,
          locationInsight: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      this.prisma.listing.count({
        where,
      }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchSuggestions(query: string, limit: number) {
    const searchTerm = query.trim();
    const listings = await this.prisma.listing.findMany({
      where: {
        status: { in: ['ACTIVE', 'APPROVED'] },
        isDeleted: false,
        OR: [
          { title: { contains: searchTerm } },
          { city: { contains: searchTerm } },
          { governorate: { contains: searchTerm } },
          { country: { contains: searchTerm } },
          { area: { name: { contains: searchTerm } } },
        ],
      },
      take: limit,
      orderBy: [{ title: 'asc' }, { city: 'asc' }],
      select: {
        id: true,
        title: true,
        city: true,
        governorate: true,
        country: true,
        area: {
          select: {
            name: true,
          },
        },
      },
    });

    if (listings.length === 0) {
      const fallbackResults = await this.prisma.$queryRaw`
        SELECT id, title, city, governorate, country, googleFormattedAddress
        FROM listings
        WHERE status IN ('ACTIVE', 'APPROVED')
          AND isDeleted = 0
          AND (
            SOUNDEX(title) = SOUNDEX(${searchTerm})
            OR SOUNDEX(city) = SOUNDEX(${searchTerm})
            OR SOUNDEX(governorate) = SOUNDEX(${searchTerm})
            OR SOUNDEX(country) = SOUNDEX(${searchTerm})
          )
        LIMIT ${limit}
      `;

      return {
        data: fallbackResults as Array<{
          id: number;
          title: string;
          city: string;
          governorate: string;
          country: string;
        }>,
        meta: {
          total: (fallbackResults as []).length,
          limit,
        },
      };
    }

    const suggestions = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      subtitle: [listing.city, listing.governorate, listing.country]
        .filter(Boolean)
        .join(', '),
      areaName: listing.area?.name,
    }));

    return {
      data: suggestions,
      meta: {
        total: suggestions.length,
        limit,
      },
    };
  }
}
