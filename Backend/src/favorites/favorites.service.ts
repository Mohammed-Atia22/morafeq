import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  areAllRoomsFull,
  calculateCapacity,
  CAPACITY_HOLDING_BOOKING_STATUSES,
  resolveReservedPlaces,
} from '../bookings/booking-capacity';

const favoriteListingInclude = {
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
  rooms: {
    include: { images: true },
    orderBy: { roomNumber: 'asc' as const },
  },
  _count: {
    select: {
      reviews: true,
    },
  },
} satisfies Prisma.ListingInclude;

type FavoriteListing = Prisma.ListingGetPayload<{
  include: typeof favoriteListingInclude;
}>;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  private parseListingIds(listingIds = '') {
    return listingIds
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  private async attachCapacityToListings(listings: FavoriteListing[]) {
    if (listings.length === 0) {
      return listings;
    }

    const reservedCounts = await this.prisma.booking.groupBy({
      by: ['listingId'],
      where: {
        listingId: { in: listings.map((listing) => listing.id) },
        status: { in: CAPACITY_HOLDING_BOOKING_STATUSES },
      },
      _count: { _all: true },
    });

    const reservedByListingId = new Map(
      reservedCounts.map((count) => [count.listingId, count._count._all]),
    );

    return listings.map((listing) => {
      const reservedPlaces = resolveReservedPlaces(
        listing,
        reservedByListingId.get(listing.id) ?? 0,
      );
      const capacity = calculateCapacity(listing.maxTenants, reservedPlaces);

      return {
        ...listing,
        ...capacity,
        isFull: capacity.isFull || areAllRoomsFull(listing),
      };
    });
  }

  private async attachAverageRatings<T extends { id: number }>(listings: T[]) {
    if (listings.length === 0) {
      return listings;
    }

    const avgRatings = await this.prisma.review.groupBy({
      by: ['listingId'],
      where: {
        listingId: { in: listings.map((listing) => listing.id) },
        isVisible: true,
      },
      _avg: { rating: true },
    });

    const ratingMap = new Map(
      avgRatings.map((rating) => [rating.listingId, rating._avg.rating ?? 0]),
    );

    return listings.map((listing) => ({
      ...listing,
      averageRating: ratingMap.get(listing.id) ?? 0,
      isFavorited: true,
    }));
  }

  async getFavorites(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        listing: {
          isDeleted: false,
          status: { in: [ListingStatus.ACTIVE, ListingStatus.APPROVED] },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: favoriteListingInclude,
        },
      },
    });

    const listings = favorites.map((favorite) => favorite.listing);
    const listingsWithCapacity = await this.attachCapacityToListings(listings);
    const listingsWithRatings =
      await this.attachAverageRatings(listingsWithCapacity);

    return {
      data: listingsWithRatings,
      meta: {
        total: listingsWithRatings.length,
      },
    };
  }

  async getStatus(userId: number, listingId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      select: { id: true },
    });

    return {
      listingId,
      isFavorited: Boolean(favorite),
    };
  }

  async getStatuses(userId: number, listingIds: string) {
    const ids = this.parseListingIds(listingIds);

    if (ids.length === 0) {
      return { data: {} };
    }

    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        listingId: { in: ids },
      },
      select: { listingId: true },
    });

    const favoritedIds = new Set(favorites.map((favorite) => favorite.listingId));

    return {
      data: ids.reduce<Record<number, boolean>>((acc, id) => {
        acc[id] = favoritedIds.has(id);
        return acc;
      }, {}),
    };
  }

  async addFavorite(userId: number, listingId: number) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
        status: { in: [ListingStatus.ACTIVE, ListingStatus.APPROVED] },
      },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not available');
    }

    try {
      await this.prisma.favorite.create({
        data: {
          userId,
          listingId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Apartment is already saved');
      }

      throw error;
    }

    return {
      message: 'تم حفظ الشقة بنجاح',
      listingId,
      isFavorited: true,
    };
  }

  async removeFavorite(userId: number, listingId: number) {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        listingId,
      },
    });

    return {
      message: 'تمت إزالة الشقة من المحفوظات',
      listingId,
      isFavorited: false,
    };
  }
}
