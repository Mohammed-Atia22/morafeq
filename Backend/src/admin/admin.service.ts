import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus,ListingStatus } from '@prisma/client';
import { ApproveListingDto } from './dto/approve-listing.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { AdminQueryListingsDto } from './dto/query-listings.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Get listings by status ────────────────

  async getListings(query: AdminQueryListingsDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(query.status
        ? {
            status:
              query.status === ListingStatus.APPROVED
                ? { in: [ListingStatus.APPROVED, ListingStatus.ACTIVE] }
                : query.status,
          }
        : {}),
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          host: {
            select: {
              id:        true,
              firstName: true,
              lastName:  true,
              email:     true,
              avatarUrl: true,
              createdAt: true,
            },
          },
          photos: {
            where: { isCover: true },
            take:  1,
          },
          area:     { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          _count: {
            select: { bookings: true, reviews: true },
          },
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

  // ─── Get single listing detail ─────────────

  async getListingDetail(listingId: number) {
    const listing = await this.prisma.listing.findFirst({
      where:   { id: listingId, isDeleted: false },
      include: {
        host: {
          select: {
            id:        true,
            firstName: true,
            lastName:  true,
            email:     true,
            avatarUrl: true,
            phone:     true,
            createdAt: true,
            _count:    { select: { listings: true } },
          },
        },
        photos:    { orderBy: { sortOrder: 'asc' } },
        amenities: true,
        area:      true,
        category:  true,
        _count: {
          select: { bookings: true, reviews: true },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  // ─── Approve listing ───────────────────────

  async approveListing(listingId: number, dto: ApproveListingDto) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, isDeleted: false },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (
      listing.status !== ListingStatus.PENDING_APPROVAL &&
      listing.status !== ListingStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        `Cannot approve a listing with status: ${listing.status}`,
      );
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data:  {
        status:     ListingStatus.APPROVED,
        approvedAt: new Date(),
        rejectionReason: null, // clear any previous rejection
      },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // ─── Reject listing ────────────────────────

  async rejectListing(listingId: number, dto: RejectListingDto) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, isDeleted: false },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (
      listing.status !== ListingStatus.PENDING_APPROVAL &&
      listing.status !== ListingStatus.SUSPENDED &&
      listing.status !== ListingStatus.APPROVED &&
      listing.status !== ListingStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Cannot reject a listing with status: ${listing.status}`,
      );
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data:  {
        status:          ListingStatus.REJECTED,
        rejectionReason: dto.reason,
        rejectedAt:      new Date(),
      },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // ─── Suspend listing ───────────────────────

  async suspendListing(listingId: number, reason: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, isDeleted: false },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data:  {
        status:          ListingStatus.SUSPENDED,
        rejectionReason: reason,
      },
    });
  }

  // ─── Get all users ─────────────────────────

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id:                 true,
          email:              true,
          firstName:          true,
          lastName:           true,
          avatarUrl:          true,
          role:               true,
          isVerified:         true,
          isActive:           true,
          onboardingCompleted: true,
          verificationStatus:  true,
          createdAt:          true,
          verification: {
            select: {
              id:              true,
              idFrontUrl:      true,
              idBackUrl:       true,
              selfieUrl:       true,
              rejectionReason: true,
            },
          },
          _count: {
            select: { listings: true, bookings: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Update user (role or active status) ──

  async updateUser(userId: number, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data:  {
        ...(dto.role     !== undefined && { role:     dto.role     }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        role:      true,
        isActive:  true,
      },
    });
  }

  // ─── Deactivate user ───────────────────────

  async deactivateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data:  { isActive: false },
      select: {
        id:       true,
        email:    true,
        isActive: true,
      },
    });
  }

  // ─── Dashboard stats ───────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      totalListings,
      pendingListings,
      approvedListings,
      totalBookings,
      confirmedBookings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.listing.count({ where: { isDeleted: false } }),
      this.prisma.listing.count({ where: { status: ListingStatus.PENDING_APPROVAL, isDeleted: false } }),
      this.prisma.listing.count({ where: { status: { in: [ListingStatus.APPROVED, ListingStatus.ACTIVE] }, isDeleted: false } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
  where: {
    status: {
      in: [
        BookingStatus.CHECK_IN_PENDING,
        BookingStatus.COMPLETED,
      ],
    },
  },
}),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      listings: {
        total:    totalListings,
        pending:  pendingListings,
        approved: approvedListings,
      },
      bookings: {
        total:     totalBookings,
        confirmed: confirmedBookings,
      },
    };
  }
}