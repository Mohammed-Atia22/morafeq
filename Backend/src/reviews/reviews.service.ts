import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { BookingStatus, ReviewType } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ─── Create review ─────────────────────────

  async create(reviewerId: number, dto: CreateReviewDto) {
    // 1. find the booking with all relations
    const booking = await this.prisma.booking.findUnique({
      where:   { id: dto.bookingId },
      include: {
        listing: true,
        guest:   true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. booking must be COMPLETED
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'You can only review completed bookings',
      );
    }

    // 3. validate who can write which type
    if (dto.type === ReviewType.GUEST_TO_HOST) {
      // only the guest can write a guest-to-host review
      if (booking.guestId !== reviewerId) {
        throw new ForbiddenException(
          'Only the guest of this booking can write a guest-to-host review',
        );
      }
    } else if (dto.type === ReviewType.HOST_TO_GUEST) {
      // only the host can write a host-to-guest review
      if (booking.listing.hostId !== reviewerId) {
        throw new ForbiddenException(
          'Only the host of this listing can write a host-to-guest review',
        );
      }
    }

    // 4. check no review of this type already exists for this booking
    const existingReview = await this.prisma.review.findUnique({
      where: {
        bookingId_type: {
          bookingId: dto.bookingId,
          type:      dto.type,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException(
        `You have already submitted a ${dto.type} review for this booking`,
      );
    }

    // 5. determine who is being reviewed
    const reviewedId =
      dto.type === ReviewType.GUEST_TO_HOST
        ? booking.listing.hostId   // guest reviews the host
        : booking.guestId;         // host reviews the guest

    // 6. listing is only linked for GUEST_TO_HOST reviews
    const listingId =
      dto.type === ReviewType.GUEST_TO_HOST
        ? booking.listingId
        : null;

    // 7. create the review
    const review = await this.prisma.review.create({
      data: {
        bookingId:   dto.bookingId,
        reviewerId,
        reviewedId,
        listingId,
        type:        dto.type,
        rating:      dto.rating,
        cleanliness: dto.type === ReviewType.GUEST_TO_HOST ? dto.cleanliness : null,
        location:    dto.type === ReviewType.GUEST_TO_HOST ? dto.location    : null,
        accuracy:    dto.type === ReviewType.GUEST_TO_HOST ? dto.accuracy    : null,
        value:       dto.type === ReviewType.GUEST_TO_HOST ? dto.value       : null,
        comment:     dto.comment,
        isVisible:   true,
      },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        reviewed: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return review;
  }

  // ─── Get reviews FOR a listing (public) ────

  async getListingReviews(listingId: number, query: QueryReviewsDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, isDeleted: false },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where:   { listingId, isVisible: true, type: ReviewType.GUEST_TO_HOST },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.review.count({
        where: { listingId, isVisible: true, type: ReviewType.GUEST_TO_HOST },
      }),
    ]);

    const aggregates = await this.prisma.review.aggregate({
      where: { listingId, isVisible: true, type: ReviewType.GUEST_TO_HOST },
      _avg:  {
        rating:      true,
        cleanliness: true,
        location:    true,
        accuracy:    true,
        value:       true,
      },
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages:        Math.ceil(total / limit),
        averageRating:     Number(aggregates._avg.rating?.toFixed(1)      ?? 0),
        averageCleanliness: Number(aggregates._avg.cleanliness?.toFixed(1) ?? 0),
        averageLocation:   Number(aggregates._avg.location?.toFixed(1)    ?? 0),
        averageAccuracy:   Number(aggregates._avg.accuracy?.toFixed(1)    ?? 0),
        averageValue:      Number(aggregates._avg.value?.toFixed(1)       ?? 0),
      },
    };
  }

  // ─── Get reviews FOR a host (public profile) ──

  async getHostReviews(hostId: number, query: QueryReviewsDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where:   {
          reviewedId: hostId,
          isVisible:  true,
          type:       ReviewType.GUEST_TO_HOST,
        },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          listing: {
            select: { id: true, title: true },
          },
        },
      }),
      this.prisma.review.count({
        where: {
          reviewedId: hostId,
          isVisible:  true,
          type:       ReviewType.GUEST_TO_HOST,
        },
      }),
    ]);

    const aggregates = await this.prisma.review.aggregate({
      where: { reviewedId: hostId, isVisible: true, type: ReviewType.GUEST_TO_HOST },
      _avg:  { rating: true },
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages:    Math.ceil(total / limit),
        averageRating: Number(aggregates._avg.rating?.toFixed(1) ?? 0),
      },
    };
  }

  // ─── Get reviews FOR a guest ───────────────

  async getGuestReviews(guestId: number, query: QueryReviewsDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where:   {
          reviewedId: guestId,
          isVisible:  true,
          type:       ReviewType.HOST_TO_GUEST,
        },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          listing: {
            select: { id: true, title: true },
          },
        },
      }),
      this.prisma.review.count({
        where: {
          reviewedId: guestId,
          isVisible:  true,
          type:       ReviewType.HOST_TO_GUEST,
        },
      }),
    ]);

    const aggregates = await this.prisma.review.aggregate({
      where: { reviewedId: guestId, isVisible: true, type: ReviewType.HOST_TO_GUEST },
      _avg:  { rating: true },
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages:    Math.ceil(total / limit),
        averageRating: Number(aggregates._avg.rating?.toFixed(1) ?? 0),
      },
    };
  }

  // ─── Get reviews I WROTE ────────────────────

  async getMyWrittenReviews(reviewerId: number) {
    return this.prisma.review.findMany({
      where:   { reviewerId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewed: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        listing: {
          select: {
            id:     true,
            title:  true,
            photos: { where: { isCover: true }, take: 1 },
          },
        },
      },
    });
  }

  // ─── Get reviews I RECEIVED ─────────────────

  async getMyReceivedReviews(userId: number) {
    return this.prisma.review.findMany({
      where:   { reviewedId: userId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });
  }

  // ─── Check if user can review a booking ────

  async canReview(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { listing: true },
    });

    if (!booking || booking.status !== BookingStatus.COMPLETED) {
      return { canReview: false, reason: 'Booking not completed' };
    }

    const isGuest = booking.guestId === userId;
    const isHost  = booking.listing.hostId === userId;

    if (!isGuest && !isHost) {
      return { canReview: false, reason: 'Not part of this booking' };
    }

    const reviewType = isGuest
      ? ReviewType.GUEST_TO_HOST
      : ReviewType.HOST_TO_GUEST;

    const existing = await this.prisma.review.findUnique({
      where: {
        bookingId_type: { bookingId, type: reviewType },
      },
    });

    return {
      canReview:  !existing,
      reviewType,
      alreadyReviewed: !!existing,
    };
  }

  // ─── Delete review ─────────────────────────

  async remove(reviewId: number, userId: number, isAdmin = false) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');

    if (!isAdmin && review.reviewerId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    return { message: 'Review deleted successfully' };
  }

  // ─── Admin: toggle visibility ──────────────

  async toggleVisibility(reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data:  { isVisible: !review.isVisible },
    });
  }
}