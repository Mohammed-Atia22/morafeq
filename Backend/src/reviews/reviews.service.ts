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
  // 1. هات الحجز والعقار والمغترب
  const booking = await this.prisma.booking.findUnique({
    where: {
      id: dto.bookingId,
    },
    include: {
      listing: true,
      guest: true,
    },
  });

  if (!booking) {
    throw new NotFoundException('Booking not found');
  }

  // 2. التقييم متاح فقط بعد إتمام الحجز
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new BadRequestException(
      'You can only review completed bookings',
    );
  }

  const isGuest = booking.guestId === reviewerId;
  const isHost = booking.listing.hostId === reviewerId;

  // 3. تحديد من يحق له كتابة كل نوع تقييم
  switch (dto.type) {
    case ReviewType.GUEST_TO_LISTING:
      if (!isGuest) {
        throw new ForbiddenException(
          'Only the guest can review the listing',
        );
      }
      break;

    case ReviewType.GUEST_TO_HOST:
      if (!isGuest) {
        throw new ForbiddenException(
          'Only the guest can review the host',
        );
      }
      break;

    case ReviewType.HOST_TO_GUEST:
      if (!isHost) {
        throw new ForbiddenException(
          'Only the host can review the guest',
        );
      }
      break;

    default:
      throw new BadRequestException(
        'Invalid review type',
      );
  }

  // 4. حماية إضافية لتقييم السكن
  if (dto.type === ReviewType.GUEST_TO_LISTING) {
    if (
      dto.cleanliness === undefined ||
      dto.location === undefined ||
      dto.accuracy === undefined ||
      dto.value === undefined
    ) {
      throw new BadRequestException(
        'Listing review requires cleanliness, location, accuracy, and value ratings',
      );
    }
  }

  // 5. منع تكرار نفس نوع التقييم لنفس الحجز
  const existingReview =
    await this.prisma.review.findUnique({
      where: {
        bookingId_type: {
          bookingId: dto.bookingId,
          type: dto.type,
        },
      },
    });

  if (existingReview) {
    throw new ConflictException(
      `A ${dto.type} review already exists for this booking`,
    );
  }

  /*
    reviewedId:
    - تقييم السكن: null، لأننا لا نقيّم مستخدمًا
    - تقييم صاحب السكن: hostId
    - تقييم المغترب: guestId
  */
  let reviewedId: number | null = null;

  if (dto.type === ReviewType.GUEST_TO_HOST) {
    reviewedId = booking.listing.hostId;
  }

  if (dto.type === ReviewType.HOST_TO_GUEST) {
    reviewedId = booking.guestId;
  }

  // كل التقييمات مرتبطة بالعقار لمعرفة سياق الحجز
  const listingId = booking.listingId;

  // 6. إنشاء التقييم
  return this.prisma.review.create({
    data: {
      bookingId: dto.bookingId,
      reviewerId,
      reviewedId,
      listingId,
      type: dto.type,

      // التقييم العام من 1 إلى 5
      rating: dto.rating,

      // التقييمات الفرعية تخص السكن فقط
      cleanliness:
        dto.type === ReviewType.GUEST_TO_LISTING
          ? dto.cleanliness
          : null,

      location:
        dto.type === ReviewType.GUEST_TO_LISTING
          ? dto.location
          : null,

      accuracy:
        dto.type === ReviewType.GUEST_TO_LISTING
          ? dto.accuracy
          : null,

      value:
        dto.type === ReviewType.GUEST_TO_LISTING
          ? dto.value
          : null,

      comment: dto.comment,
      isVisible: true,
    },

    include: {
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },

      reviewed: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },

      listing: {
        select: {
          id: true,
          title: true,
          photos: {
            where: {
              isCover: true,
            },
            take: 1,
          },
        },
      },
    },
  });
}

  // ─── Get reviews FOR a listing (public) ────

  async getListingReviews(
  listingId: number,
  query: QueryReviewsDto,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const listing = await this.prisma.listing.findFirst({
    where: {
      id: listingId,
      isDeleted: false,
    },
  });

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  // تقييمات السكن فقط
  const where = {
    listingId,
    isVisible: true,
    type: ReviewType.GUEST_TO_LISTING,
  };

  const [reviews, total, aggregates] = await Promise.all([
    this.prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
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
    }),

    this.prisma.review.count({
      where,
    }),

    this.prisma.review.aggregate({
      where,
      _avg: {
        rating: true,
        cleanliness: true,
        location: true,
        accuracy: true,
        value: true,
      },
    }),
  ]);

  return {
    data: reviews,

    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),

      averageRating: Number(
        aggregates._avg.rating?.toFixed(1) ?? 0,
      ),

      averageCleanliness: Number(
        aggregates._avg.cleanliness?.toFixed(1) ?? 0,
      ),

      averageLocation: Number(
        aggregates._avg.location?.toFixed(1) ?? 0,
      ),

      averageAccuracy: Number(
        aggregates._avg.accuracy?.toFixed(1) ?? 0,
      ),

      averageValue: Number(
        aggregates._avg.value?.toFixed(1) ?? 0,
      ),
    },
  };
}

  // ─── Get reviews FOR a host (public profile) ──

  async getHostReviews(
  hostId: number,
  query: QueryReviewsDto,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const host = await this.prisma.user.findUnique({
    where: {
      id: hostId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!host) {
    throw new NotFoundException('Host not found');
  }

  // تقييمات تعامل صاحب السكن فقط
  const where = {
    reviewedId: hostId,
    isVisible: true,
    type: ReviewType.GUEST_TO_HOST,
  };

  const [reviews, total, aggregates] = await Promise.all([
    this.prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },

        listing: {
          select: {
            id: true,
            title: true,
            photos: {
              where: {
                isCover: true,
              },
              take: 1,
            },
          },
        },
      },
    }),

    this.prisma.review.count({
      where,
    }),

    this.prisma.review.aggregate({
      where,
      _avg: {
        rating: true,
      },
    }),
  ]);

  return {
    data: reviews,

    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),

      averageRating: Number(
        aggregates._avg.rating?.toFixed(1) ?? 0,
      ),
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
    where: {
      id: bookingId,
    },
    include: {
      listing: true,
    },
  });

  // التقييم متاح بعد اكتمال الحجز فقط
  if (!booking || booking.status !== BookingStatus.COMPLETED) {
    return {
      canReview: false,
      reason: 'Booking not completed',
      availableReviews: [],
    };
  }

  const isGuest = booking.guestId === userId;
  const isHost = booking.listing.hostId === userId;

  // المستخدم ليس طرفًا في الحجز
  if (!isGuest && !isHost) {
    return {
      canReview: false,
      reason: 'You are not part of this booking',
      availableReviews: [],
    };
  }

  // المغترب يستطيع تقييم السكن وصاحب السكن بشكل منفصل
  if (isGuest) {
    const guestReviewTypes = [
      ReviewType.GUEST_TO_LISTING,
      ReviewType.GUEST_TO_HOST,
    ];

    const existingReviews =
      await this.prisma.review.findMany({
        where: {
          bookingId,
          type: {
            in: guestReviewTypes,
          },
        },
        select: {
          id: true,
          type: true,
        },
      });

    const existingTypes = new Set(
      existingReviews.map((review) => review.type),
    );

    const availableReviews = [
      {
        type: ReviewType.GUEST_TO_LISTING,
        title: 'Review the property',
        canReview: !existingTypes.has(
          ReviewType.GUEST_TO_LISTING,
        ),
        alreadyReviewed: existingTypes.has(
          ReviewType.GUEST_TO_LISTING,
        ),
      },
      {
        type: ReviewType.GUEST_TO_HOST,
        title: 'Review the host',
        canReview: !existingTypes.has(
          ReviewType.GUEST_TO_HOST,
        ),
        alreadyReviewed: existingTypes.has(
          ReviewType.GUEST_TO_HOST,
        ),
      },
    ];

    return {
      canReview: availableReviews.some(
        (review) => review.canReview,
      ),
      role: 'GUEST',
      availableReviews,
    };
  }

  // صاحب السكن يستطيع تقييم المغترب فقط
  const existingHostReview =
    await this.prisma.review.findUnique({
      where: {
        bookingId_type: {
          bookingId,
          type: ReviewType.HOST_TO_GUEST,
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

  return {
    canReview: !existingHostReview,
    role: 'HOST',

    availableReviews: [
      {
        type: ReviewType.HOST_TO_GUEST,
        title: 'Review the guest',
        canReview: !existingHostReview,
        alreadyReviewed: Boolean(existingHostReview),
      },
    ],
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

    await this.prisma.review.update({
  where: {
    id: reviewId,
  },
  data: {
    isVisible: false,
  },
});

return {
  message: 'Review removed successfully',
};
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