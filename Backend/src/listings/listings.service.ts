import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PrismaService } from './../prisma/prisma.service';
import {
  ListingStatus,
  UserRole,
  BlockReason,
  VerificationStatus,
} from '@prisma/client';
import { AreasService } from '../areas/areas.service';
import { UploadsService } from '../uploads/uploads.service';
import { SearchListingDto } from './dto/search-listing.dto';
import { SetAmenitiesDto } from './dto/set-amenities.dto';
import { BlockDatesDto } from './dto/block-dates.dto';
import { LocationInsightsService } from './../location-insights/location-insights.service';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areasService: AreasService,
    private uploads: UploadsService,
    private readonly locationInsightsService: LocationInsightsService,
  ) {}

  async create(hostId: number, dto: CreateListingDto) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!host) {
      throw new ForbiddenException('User not found');
    }

    if (!host.isActive) {
      throw new ForbiddenException('This account is deactivated');
    }

    if (host.role !== UserRole.HOST) {
      throw new ForbiddenException('Only hosts can create listings');
    }

    const availableFromDate = new Date(dto.availableFrom);

    if (Number.isNaN(availableFromDate.getTime())) {
      throw new BadRequestException('Invalid availableFrom date');
    }

    const area = await this.areasService.findOrCreateArea({
      name: dto.areaName,
      city: dto.city,
      governorate: dto.governorate,
      country: dto.country ?? 'Egypt',
      googlePlaceId: dto.googlePlaceId,
    });

    const listing = await this.prisma.listing.create({
      data: {
        hostId,

        title: dto.title,
        description: dto.description,

        propertyType: dto.propertyType,
        roomType: dto.roomType,

        streetName: dto.streetName,
        buildingNumber: dto.buildingNumber,
        floorNumber: dto.floorNumber,
        apartmentNumber: dto.apartmentNumber,
        nearbyLandmark: dto.nearbyLandmark,

        city: dto.city,
        governorate: dto.governorate,
        country: dto.country ?? 'Egypt',

        lat: dto.lat,
        lng: dto.lng,

        googleFormattedAddress: dto.googleFormattedAddress,
        googlePlaceId: dto.googlePlaceId,

        locationPrivacy: dto.locationPrivacy ?? 'APPROXIMATE',

        monthlyRent: dto.monthlyRent,
        depositAmount: dto.depositAmount ?? 0,
        currency: dto.currency ?? 'EGP',

        areaId: area.id,

        maxTenants: dto.maxTenants,
        bedrooms: dto.bedrooms,
        beds: dto.beds,
        bathrooms: dto.bathrooms,

        availableFrom: availableFromDate,

        genderPreference: dto.genderPreference,
        smokingPolicy: dto.smokingPolicy ?? 'NOT_ALLOWED',

        status: ListingStatus.DRAFT,
      },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
            trustScore: true,
          },
        },
        category: true,
        photos: true,
        amenities: true,
      },
    });

    this.locationInsightsService
      .generateForListingAutomatically(listing.id)
      .catch((error) => {
        console.error('Failed to generate location insight:', error);
      });

    return {
      message: 'Listing created successfully',
      listing,
    };
  }

  //* ─── Search listings ───────────────────────

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

  async search(dto: SearchListingDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: [ListingStatus.APPROVED, ListingStatus.ACTIVE] },
      isDeleted: false,
    };

    // Location filters
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

    // Guests
    if (dto.guests) {
      where.maxTenants = {
        gte: dto.guests,
      };
    }

    // Property filters
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

    // Monthly rent filter
    if (dto.minPrice || dto.maxPrice) {
      where.monthlyRent = {};

      if (dto.minPrice) {
        where.monthlyRent.gte = dto.minPrice;
      }

      if (dto.maxPrice) {
        where.monthlyRent.lte = dto.maxPrice;
      }
    }

    // Available from
    if (dto.availableFrom) {
      const availableFromDate = new Date(dto.availableFrom);

      if (!Number.isNaN(availableFromDate.getTime())) {
        where.availableFrom = {
          lte: availableFromDate,
        };
      }
    }

    // Amenities filter
    if (dto.amenities && dto.amenities.length > 0) {
      where.amenities = {
        some: {
          amenityKey: {
            in: dto.amenities,
          },
        },
      };
    }

    const include = {
      host: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          verificationStatus: true,
          trustScore: true,
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
    };

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
        include,
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

      if (dto.sortBy === 'price_low') {
        listingsWithDistance.sort(
          (a, b) => Number(a!.monthlyRent) - Number(b!.monthlyRent),
        );
      } else if (dto.sortBy === 'price_high') {
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

    if (dto.sortBy === 'price_low') {
      orderBy = {
        monthlyRent: 'asc',
      };
    }

    if (dto.sortBy === 'price_high') {
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
        include,
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

  async findAll() {
    const listing = await this.prisma.listing.findMany();
    const number = listing.length;

    return { message: 'done', 'number of listing is': number, listing };
  }

  //* ─── Get single listing ────────────────────

  async findOne(id: number) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, isDeleted: false },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            verificationStatus: true,
            trustScore: true,
            _count: { select: { listings: true } },
          },
        },
        category: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        amenities: true,
        reviews: {
          where: { isVisible: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: { listingId: id, isVisible: true },
      _avg: { rating: true },
    });

    return {
      ...listing,
      averageRating: avgRating._avg.rating ?? 0,
    };
  }

  async findMyListings(hostId: number) {
    return this.prisma.listing.findMany({
      where: { hostId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        area: true,
        photos: { where: { isCover: true }, take: 1 },
        amenities: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    });
  }

  async update(id: number, hostId: number, dto: UpdateListingDto) {
    await this.verifyOwnership(id, hostId);

    if (
      dto.status === ListingStatus.ACTIVE ||
      dto.status === ListingStatus.APPROVED
    ) {
      await this.ensureHostCanPublish(hostId);
    }

    const currentListing = await this.prisma.listing.findUnique({
      where: { id },
      include: { area: true },
    });

    let areaId: number | undefined;
    if (
      dto.areaName !== undefined ||
      dto.city !== undefined ||
      dto.governorate !== undefined ||
      dto.country !== undefined ||
      dto.googlePlaceId !== undefined
    ) {
      const areaName = dto.areaName ?? currentListing?.area?.name;
      const city = dto.city ?? currentListing?.city;
      const governorate = dto.governorate ?? currentListing?.governorate;
      const country = dto.country ?? currentListing?.country ?? 'Egypt';

      if (areaName && city && governorate) {
        const area = await this.areasService.findOrCreateArea({
          name: areaName,
          city,
          governorate,
          country,
          googlePlaceId:
            dto.googlePlaceId ?? currentListing?.googlePlaceId ?? undefined,
        });
        areaId = area.id;
      }
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.propertyType !== undefined && {
          propertyType: dto.propertyType,
        }),

        ...(dto.roomType !== undefined && {
          roomType: dto.roomType,
        }),

        ...(dto.streetName !== undefined && {
          streetName: dto.streetName,
        }),

        ...(dto.buildingNumber !== undefined && {
          buildingNumber: dto.buildingNumber,
        }),

        ...(dto.floorNumber !== undefined && {
          floorNumber: dto.floorNumber,
        }),

        ...(dto.apartmentNumber !== undefined && {
          apartmentNumber: dto.apartmentNumber,
        }),

        ...(dto.nearbyLandmark !== undefined && {
          nearbyLandmark: dto.nearbyLandmark,
        }),

        ...(dto.city !== undefined && {
          city: dto.city,
        }),

        ...(dto.governorate !== undefined && {
          governorate: dto.governorate,
        }),

        ...(dto.country !== undefined && {
          country: dto.country,
        }),

        ...(dto.lat !== undefined && {
          lat: dto.lat,
        }),

        ...(dto.lng !== undefined && {
          lng: dto.lng,
        }),

        ...(dto.googleFormattedAddress !== undefined && {
          googleFormattedAddress: dto.googleFormattedAddress,
        }),

        ...(dto.googlePlaceId !== undefined && {
          googlePlaceId: dto.googlePlaceId,
        }),

        ...(areaId !== undefined && {
          areaId,
        }),

        ...(dto.locationPrivacy !== undefined && {
          locationPrivacy: dto.locationPrivacy,
        }),

        ...(dto.monthlyRent !== undefined && {
          monthlyRent: dto.monthlyRent,
        }),

        ...(dto.depositAmount !== undefined && {
          depositAmount: dto.depositAmount,
        }),

        ...(dto.currency !== undefined && {
          currency: dto.currency,
        }),

        ...(dto.maxTenants !== undefined && {
          maxTenants: dto.maxTenants,
        }),

        ...(dto.bedrooms !== undefined && {
          bedrooms: dto.bedrooms,
        }),

        ...(dto.beds !== undefined && {
          beds: dto.beds,
        }),

        ...(dto.bathrooms !== undefined && {
          bathrooms: dto.bathrooms,
        }),

        ...(dto.furnished !== undefined && {
          furnished: dto.furnished,
        }),

        ...(dto.utilitiesIncluded !== undefined && {
          utilitiesIncluded: dto.utilitiesIncluded,
        }),

        ...(dto.internetIncluded !== undefined && {
          internetIncluded: dto.internetIncluded,
        }),

        ...(dto.minimumStayMonths !== undefined && {
          minimumStayMonths: dto.minimumStayMonths,
        }),

        ...(dto.maximumStayMonths !== undefined && {
          maximumStayMonths: dto.maximumStayMonths,
        }),

        ...(dto.availableFrom !== undefined && {
          availableFrom: new Date(dto.availableFrom),
        }),

        ...(dto.genderPreference !== undefined && {
          genderPreference: dto.genderPreference,
        }),

        ...(dto.smokingPolicy !== undefined && {
          smokingPolicy: dto.smokingPolicy,
        }),

        // ...(dto.areaId !== undefined && {
        //   areaId: dto.areaId,
        // }),

        // ...(dto.categoryId!== undefined && {
        //   categoryId: dto.categoryId,
        // }),

        // Only keep this if hosts are allowed to change status
        ...(dto.status !== undefined && {
          status: dto.status,
        }),
      },

      include: {
        photos: true,
        amenities: true,
        area: true,
        category: true,
      },
    });
  }

  // ─── Publish listing ───────────────────────

  // ─── Submit listing for admin review ──────

async submit(id: number, hostId: number) {
  const listing = await this.verifyOwnership(id, hostId);
  await this.ensureHostCanPublish(hostId);

  // must have at least one photo before submitting
  if (
    listing.status === ListingStatus.ACTIVE ||
    listing.status === ListingStatus.APPROVED
  ) {
    throw new BadRequestException(
      'This listing is already active',
    );
  }

  if (listing.status === ListingStatus.SUSPENDED) {
    throw new ForbiddenException(
      'This listing has been suspended and cannot be resubmitted',
    );
  }

  // check photos exist
  const photoCount = await this.prisma.listingPhoto.count({
    where: { listingId: id },
  });

  if (photoCount === 0) {
    throw new BadRequestException(
      'Please upload at least one photo before submitting',
    );
  }

  return this.prisma.listing.update({
    where: { id },
    data: {
      status:      ListingStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
      approvedAt:  null,
    },
    select: {
      id:          true,
      title:       true,
      status:      true,
      submittedAt: true,
      approvedAt:  true,
    },
  });
}

  // ─── Upload photos ─────────────────────────

  async uploadPhotos(
  id: number,
  hostId: number,
  files: Express.Multer.File[],
) {
  await this.verifyOwnership(id, hostId);

  if (!files?.length) {
    throw new BadRequestException('Please upload at least one photo');
  }

  const existingCount = await this.prisma.listingPhoto.count({
    where: { listingId: id },
  });

  if (existingCount + files.length > 20) {
    throw new BadRequestException('Maximum 20 photos allowed per listing');
  }

  // upload all files to ImageBB in parallel
  const uploadPromises = files.map((file, index) =>
    this.uploads.uploadImage(file, 'listings').then((result) => ({
      listingId: id,
      url:       result.url,
      deleteUrl: result.deleteUrl,
      sortOrder: existingCount + index,
      isCover:   existingCount === 0 && index === 0,
    })),
  );

  const photoData = await Promise.all(uploadPromises);

  await this.prisma.listingPhoto.createMany({ data: photoData });

  return this.prisma.listingPhoto.findMany({
    where:   { listingId: id },
    orderBy: { sortOrder: 'asc' },
  });
}

  // ─── Delete photo ──────────────────────────

  async deletePhoto(listingId: number, photoId: number, hostId: number) {
  await this.verifyOwnership(listingId, hostId);

  const photo = await this.prisma.listingPhoto.findFirst({
    where: { id: photoId, listingId },
    select: {
      id: true,
      listingId: true,
      url: true,
      thumbnailUrl: true,
      sortOrder: true,
      isCover: true,
      createdAt: true,
      deleteUrl: true,
    },
  });

  if (!photo) throw new NotFoundException('Photo not found');

  // delete from ImageBB using stored deleteUrl
  await this.uploads.deleteImage(photo.deleteUrl);

  // delete from database
  await this.prisma.listingPhoto.delete({ where: { id: photoId } });

  // if deleted photo was the cover, promote the next photo
  if (photo.isCover) {
    const next = await this.prisma.listingPhoto.findFirst({
      where:   { listingId },
      orderBy: { sortOrder: 'asc' },
    });

    if (next) {
      await this.prisma.listingPhoto.update({
        where: { id: next.id },
        data:  { isCover: true },
      });
    }
  }

  return { message: 'Photo deleted successfully' };
}

  // ─── Set amenities ─────────────────────────

  async setAmenities(id: number, hostId: number, dto: SetAmenitiesDto) {
    await this.verifyOwnership(id, hostId);

    // Delete existing and recreate — clean approach
    await this.prisma.listingAmenity.deleteMany({ where: { listingId: id } });

    if (dto.amenities!.length > 0) {
      await this.prisma.listingAmenity.createMany({
        data: dto.amenities!.map((key) => ({
          listingId: id,
          amenityKey: key,
        })),
      });
    }

    return this.prisma.listingAmenity.findMany({ where: { listingId: id } });
  }

  // ─── Get availability ──────────────────────

  async getAvailability(id: number, month: string) {
    // month format: 2024-06
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        listingId: id,
        blockedDate: { gte: startDate, lt: endDate },
      },
      orderBy: { blockedDate: 'asc' },
    });

    return blocks.map((b) => ({
      date: b.blockedDate,
      reason: b.reason,
    }));
  }

  // ─── Block dates ───────────────────────────

  async blockDates(id: number, hostId: number, dto: BlockDatesDto) {
    await this.verifyOwnership(id, hostId);

    const data = dto.dates.map((dateStr) => ({
      listingId: id,
      blockedDate: new Date(dateStr),
      reason: dto.reason ?? BlockReason.HOST_BLOCKED,
    }));

    // skipDuplicates prevents error if date already blocked
    await this.prisma.availabilityBlock.createMany({
      data,
      skipDuplicates: true,
    });

    return { message: `${dto.dates.length} dates blocked` };
  }

  // ─── Unblock dates ─────────────────────────

  async unblockDates(id: number, hostId: number, dates: string[]) {
    await this.verifyOwnership(id, hostId);

    const parsedDates = dates.map((d) => new Date(d));

    await this.prisma.availabilityBlock.deleteMany({
      where: {
        listingId: id,
        blockedDate: { in: parsedDates },
        reason: BlockReason.HOST_BLOCKED,
      },
    });

    return { message: 'Dates unblocked' };
  }

  // ─── Private: verify ownership ─────────────

  private async verifyOwnership(listingId: number, hostId: number) {
  const listing = await this.prisma.listing.findFirst({
    where: { id: listingId, isDeleted: false },
  });

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  if (listing.hostId !== hostId) {
    throw new ForbiddenException(
      'You do not have permission to modify this listing',
    );
  }

  return listing; // ← make sure this line exists
}

  // ─── Soft delete ───────────────────────────

  private async ensureHostCanPublish(hostId: number) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: {
        verificationStatus: true,
        verification: {
          select: { status: true },
        },
      },
    });

    const hostVerificationStatus =
      host?.verification?.status ?? host?.verificationStatus;

    if (hostVerificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'You need to verify your identity before publishing a listing',
      );
    }
  }

  async remove(id: number, hostId: number) {
    await this.verifyOwnership(id, hostId);

    await this.prisma.listing.update({
      where: { id },
      data: { isDeleted: true, status: ListingStatus.INACTIVE },
    });

    return { message: 'Listing deleted successfully' };
  }
}
