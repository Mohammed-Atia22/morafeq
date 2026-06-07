import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PrismaService } from './../prisma/prisma.service';
import { ListingStatus, UserRole,BlockReason } from '@prisma/client';
import { AreasService } from '../areas/areas.service';
import { UploadsService } from '../uploads/uploads.service';
import { SearchListingDto } from './dto/search-listing.dto';
import { SetAmenitiesDto } from './dto/set-amenities.dto';
import { BlockDatesDto } from './dto/block-dates.dto';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areasService: AreasService,
    private uploads: UploadsService,
  ) {}

  async create(hostId: number, dto: CreateListingDto) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: {
        id: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!host) {
      throw new ForbiddenException('User not found');
    }

    if (!host.isActive) {
      throw new ForbiddenException('This account is deactivated');
    }

    if (!host.isVerified) {
      throw new ForbiddenException('Please verify your account first');
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
        host:     { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        category: true,
        photos:   true,
        amenities: true,
      },
    });

    return {
      message: 'Listing created successfully',
      listing,
    };
  }

  // ─── Search listings ───────────────────────

  async search(dto: SearchListingDto) {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 12;
    const skip  = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status:    ListingStatus.ACTIVE,
      isDeleted: false,
    };

    if (dto.city)    where.city    = { contains: dto.city,    mode: 'insensitive' };
    if (dto.country) where.country = { contains: dto.country, mode: 'insensitive' };
    if (dto.guests)  where.maxGuests = { gte: dto.guests };
    if (dto.categoryId) where.categoryId = dto.categoryId;

    if (dto.minPrice || dto.maxPrice) {
      where.pricePerNight = {};
      if (dto.minPrice) where.pricePerNight.gte = dto.minPrice;
      if (dto.maxPrice) where.pricePerNight.lte = dto.maxPrice;
    }

    // Filter by amenities
    if (dto.amenities && dto.amenities.length > 0) {
      where.amenities = {
        some: {
          amenityKey: { in: dto.amenities },
        },
      };
    }

    // Filter by available dates
    if (dto.checkIn && dto.checkOut) {
      const checkIn  = new Date(dto.checkIn);
      const checkOut = new Date(dto.checkOut);

      where.NOT = {
        availabilityBlocks: {
          some: {
            blockedDate: {
              gte: checkIn,
              lt:  checkOut,
            },
          },
        },
      };
    }

    // Run query and count in parallel
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          host:     { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, iconUrl: true } },
          photos:   { where: { isCover: true }, take: 1 },
          amenities: true,
          _count:   { select: { reviews: true } },
        },
      }),
      this.prisma.listing.count({ where }),
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

  findAll() {
    return `This action returns all listings`;
  }

  // ─── Get single listing ────────────────────

  async findOne(id: number) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, isDeleted: false },
      include: {
        host: {
          select: {
            id:        true,
            firstName: true,
            lastName:  true,
            avatarUrl: true,
            createdAt: true,
            _count:    { select: { listings: true } },
          },
        },
        category:  true,
        photos:    { orderBy: { sortOrder: 'asc' } },
        amenities: true,
        reviews: {
          where:   { isVisible: true },
          take:    5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where:   { listingId: id, isVisible: true },
      _avg:    { rating: true },
    });

    return {
      ...listing,
      averageRating: avgRating._avg.rating ?? 0,
    };
  }

  async findMyListings(hostId: number) {
    return this.prisma.listing.findMany({
      where:   { hostId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        photos:    { where: { isCover: true }, take: 1 },
        amenities: true,
        _count:    { select: { bookings: true, reviews: true } },
      },
    });
  }

  async update(id: number, hostId: number, dto: UpdateListingDto) {
  await this.verifyOwnership(id, hostId);

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

  async publish(id: number, hostId: number) {
    await this.verifyOwnership(id, hostId);

    const listing = await this.prisma.listing.findUnique({
      where:   { id },
      include: { photos: true },
    });

    if (listing!.photos.length === 0) {
      throw new BadRequestException(
        'Please add at least one photo before publishing',
      );
    }

    return this.prisma.listing.update({
      where: { id },
      data:  { status: ListingStatus.ACTIVE },
    });
  }

  // ─── Upload photos ─────────────────────────

  async uploadPhotos(
    id: number,
    hostId: number,
    files: Express.Multer.File[],
  ) {
    await this.verifyOwnership(id, hostId);

    const existingCount = await this.prisma.listingPhoto.count({
      where: { listingId: id },
    });

    if (existingCount + files.length > 20) {
      throw new BadRequestException(
        'Maximum 20 photos allowed per listing',
      );
    }

    // Upload all files to S3 in parallel
    const uploadPromises = files.map((file, index) =>
      this.uploads.uploadImage(file, 'listings').then((url) => ({
        listingId: id,
        url,
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
    });

    if (!photo) throw new NotFoundException('Photo not found');

    await this.uploads.deleteImage(photo.url);

    await this.prisma.listingPhoto.delete({ where: { id: photoId } });

    // If deleted photo was cover, set first remaining as cover
    if (photo.isCover) {
      const first = await this.prisma.listingPhoto.findFirst({
        where:   { listingId },
        orderBy: { sortOrder: 'asc' },
      });
      if (first) {
        await this.prisma.listingPhoto.update({
          where: { id: first.id },
          data:  { isCover: true },
        });
      }
    }

    return { message: 'Photo deleted' };
  }

  // ─── Set amenities ─────────────────────────

  async setAmenities(id: number, hostId: number, dto: SetAmenitiesDto) {
    await this.verifyOwnership(id, hostId);

    // Delete existing and recreate — clean approach
    await this.prisma.listingAmenity.deleteMany({ where: { listingId: id } });

    if (dto.amenities!.length > 0) {
      await this.prisma.listingAmenity.createMany({
        data: dto.amenities!.map((key) => ({
          listingId:  id,
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
    const startDate   = new Date(year, mon - 1, 1);
    const endDate     = new Date(year, mon, 1);

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        listingId:   id,
        blockedDate: { gte: startDate, lt: endDate },
      },
      orderBy: { blockedDate: 'asc' },
    });

    return blocks.map((b) => ({
      date:   b.blockedDate,
      reason: b.reason,
    }));
  }

  // ─── Block dates ───────────────────────────

  async blockDates(id: number, hostId: number, dto: BlockDatesDto) {
    await this.verifyOwnership(id, hostId);

    const data = dto.dates.map((dateStr) => ({
      listingId:   id,
      blockedDate: new Date(dateStr),
      reason:      dto.reason ?? BlockReason.HOST_BLOCKED,
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
        listingId:   id,
        blockedDate: { in: parsedDates },
        reason:      BlockReason.HOST_BLOCKED,
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

    return listing;
  }

  // ─── Soft delete ───────────────────────────

  async remove(id: number, hostId: number) {
    await this.verifyOwnership(id, hostId);

    await this.prisma.listing.update({
      where: { id },
      data:  { isDeleted: true, status: ListingStatus.INACTIVE },
    });

    return { message: 'Listing deleted successfully' };
  }
}
