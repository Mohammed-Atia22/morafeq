import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PrismaService } from './../prisma/prisma.service';
import { ListingStatus, UserRole } from '@prisma/client';
import { AreasService } from '../areas/areas.service';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areasService: AreasService,
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
    });

    return {
      message: 'Listing created successfully',
      listing,
    };
  }

  findAll() {
    return `This action returns all listings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} listing`;
  }

  update(id: number, updateListingDto: UpdateListingDto) {
    return `This action updates a #${id} listing`;
  }

  remove(id: number) {
    return `This action removes a #${id} listing`;
  }
}
