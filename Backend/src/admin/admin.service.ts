import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {  DisputeParticipantType,BookingStatus,ListingStatus , ReviewType } from '@prisma/client';
import {
  calculateCapacity,
  CAPACITY_HOLDING_BOOKING_STATUSES,
  areAllRoomsFull,
  resolveReservedPlaces,
} from '../bookings/booking-capacity';
import { ApproveListingDto } from './dto/approve-listing.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { AdminQueryListingsDto } from './dto/query-listings.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminQueryDisputesDto } from './dto/query-disputes.dto';
import { QueryDisputeMessagesDto } from './dto/query-dispute-messages.dto';
import { OpenDisputeConversationDto } from './dto/open-dispute-conversation.dto';
import { SendDisputeMessageDto } from './dto/send-dispute-message.dto';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private decryptPhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const phoneCryptoSecret =
    process.env.PHONE_CRYPTO_SECRET ??
    'dev_phone_crypto_secret';

  try {
    const decryptedPhone = CryptoJS.AES.decrypt(
      phone,
      phoneCryptoSecret,
    ).toString(CryptoJS.enc.Utf8);

    return decryptedPhone || null;
  } catch {
    return null;
  }
}

  private async attachCapacityToListings<T extends { id: number; maxTenants: number; roomType?: string; rooms?: any[] }>(
    listings: T[],
  ) {
    if (listings.length === 0) return listings;

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

  async getComplaints() {
    return this.prisma.booking.findMany({
      where: {
        status: BookingStatus.DISPUTED,
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            monthlyRent: true,
            depositAmount: true,
            city: true,
            governorate: true,
            host: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { disputedAt: 'desc' },
    });
  }

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
          rooms: {
            include: { images: true },
            orderBy: { roomNumber: 'asc' as const },
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
      data: await this.attachCapacityToListings(listings),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }



  async getDisputes(query: AdminQueryDisputesDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  /*
    لو الأدمن بعت status:
    نرجع الحالة المطلوبة فقط.

    لو لم يرسل status:
    نرجع كل الحالات المرتبطة بالنزاعات.
  */
  const disputeStatuses: BookingStatus[] = [
    BookingStatus.DISPUTED,
    BookingStatus.DISPUTE_RESOLVED_FOR_HOST,
    BookingStatus.CANCELLED_AFTER_DISPUTE,
    BookingStatus.REFUNDED,
  ];

  const where: any = {
    // نضمن إن الحجز دخل فعلًا في نزاع
    disputedAt: {
      not: null,
    },

    status: query.status
      ? (query.status as BookingStatus)
      : {
          in: disputeStatuses,
        },
  };

  const [disputes, total] = await Promise.all([
    this.prisma.booking.findMany({
      where,
      skip,
      take: limit,

      // الأحدث أولًا
      orderBy: {
        disputedAt: 'desc',
      },

      select: {
        id: true,
        status: true,

        disputeReason: true,
        disputeDescription: true,
        disputeResolution: true,

        disputedAt: true,
        disputeResolvedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,

        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            verificationStatus: true,
            trustScore: true,
          },
        },

        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            governorate: true,

            photos: {
              where: {
                isCover: true,
              },
              take: 1,
              select: {
                id: true,
                url: true,
              },
            },

            host: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                email: true,
                verificationStatus: true,
                trustScore: true,
              },
            },
          },
        },

        payment: {
          select: {
            id: true,
            status: true,

            rentAmount: true,
            securityDepositAmount: true,
            platformFee: true,
            amount: true,

            guestRefundAmount: true,
            hostCompensationAmount: true,

            currency: true,
            paidAt: true,
            heldAt: true,
            refundedAt: true,
            settledAt: true,
          },
        },
      },
    }),

    this.prisma.booking.count({
      where,
    }),
  ]);

  return {
    data: disputes.map((dispute) => ({
      ...dispute,

      /*
        قيم بالجنيه لسهولة استخدامها في الفرونت.
        القيم الأصلية بالقروش ما زالت موجودة داخل payment.
      */
      paymentSummary: dispute.payment
        ? {
            totalAmount: dispute.payment.amount / 100,
            rentAmount: dispute.payment.rentAmount / 100,

            securityDepositAmount:
              dispute.payment.securityDepositAmount / 100,

            platformFee:
              dispute.payment.platformFee / 100,

            guestRefundAmount:
              dispute.payment.guestRefundAmount / 100,

            hostCompensationAmount:
              dispute.payment.hostCompensationAmount / 100,

            currency: dispute.payment.currency,
          }
        : null,
    })),

    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


async getDisputeDetail(bookingId: number) {
  // 1. جلب بيانات النزاع والحجز والطرفين والدفع
  const dispute = await this.prisma.booking.findFirst({
    where: {
      id: bookingId,

      // نتأكد أن الحجز دخل في نزاع فعلًا
      disputedAt: {
        not: null,
      },
    },

    select: {
      id: true,
      status: true,

      preferredMoveInDate: true,
      guestMessage: true,
      agreedAmount: true,
      hostResponseNote: true,

      disputeReason: true,
      disputeDescription: true,
      disputeResolution: true,

      acceptedAt: true,
      confirmedAt: true,
      disputedAt: true,
      disputeResolvedAt: true,
      cancelledAt: true,
      completedAt: true,

      createdAt: true,
      updatedAt: true,

      guest: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          verificationStatus: true,
          trustScore: true,
          isActive: true,
          createdAt: true,
        },
      },

      listing: {
        select: {
          id: true,
          title: true,
          description: true,

          city: true,
          governorate: true,
          country: true,

          monthlyRent: true,
          depositAmount: true,

          status: true,
          propertyType: true,
          roomType: true,

          photos: {
            orderBy: {
              sortOrder: 'asc',
            },
            select: {
              id: true,
              url: true,
              isCover: true,
              sortOrder: true,
            },
          },

          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              verificationStatus: true,
              trustScore: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      },

      payment: {
        select: {
          id: true,
          status: true,

          rentAmount: true,
          securityDepositAmount: true,
          platformFee: true,
          hostPayoutAmount: true,
          amount: true,

          guestRefundAmount: true,
          hostCompensationAmount: true,

          currency: true,
          paymentMethod: true,

          paidAt: true,
          heldAt: true,
          releasedAt: true,
          refundedAt: true,
          settledAt: true,

          refundReason: true,
        },
      },
    },
  });

  if (!dispute) {
    throw new NotFoundException(
      'Dispute not found',
    );
  }

  const hostId = dispute.listing.host.id;
  const guestId = dispute.guest.id;
  const listingId = dispute.listing.id;

  /*
    2. جلب ملخص التقييمات والـ Reviews.

    مهم:
    لا نستخدم isVisible: true هنا؛
    لأن الأدمن لازم يشوف التقييمات المخفية أيضًا وقت التحقيق.
  */
  const [
    hostAggregate,
    hostLowRatingsCount,
    hostHiddenReviewsCount,
    hostReviews,

    guestAggregate,
    guestLowRatingsCount,
    guestHiddenReviewsCount,
    guestReviews,

    listingAggregate,
    listingReviews,
  ] = await Promise.all([
    // ───────── تقييم صاحب السكن ─────────

    this.prisma.review.aggregate({
      where: {
        reviewedId: hostId,
        type: ReviewType.GUEST_TO_HOST,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),

    this.prisma.review.count({
      where: {
        reviewedId: hostId,
        type: ReviewType.GUEST_TO_HOST,
        rating: {
          lte: 2,
        },
      },
    }),

    this.prisma.review.count({
      where: {
        reviewedId: hostId,
        type: ReviewType.GUEST_TO_HOST,
        isVisible: false,
      },
    }),

    this.prisma.review.findMany({
      where: {
        reviewedId: hostId,
        type: ReviewType.GUEST_TO_HOST,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 10,

      select: {
        id: true,
        bookingId: true,
        rating: true,
        comment: true,
        isVisible: true,
        createdAt: true,

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
          },
        },
      },
    }),

    // ───────── تقييم المغترب ─────────

    this.prisma.review.aggregate({
      where: {
        reviewedId: guestId,
        type: ReviewType.HOST_TO_GUEST,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),

    this.prisma.review.count({
      where: {
        reviewedId: guestId,
        type: ReviewType.HOST_TO_GUEST,
        rating: {
          lte: 2,
        },
      },
    }),

    this.prisma.review.count({
      where: {
        reviewedId: guestId,
        type: ReviewType.HOST_TO_GUEST,
        isVisible: false,
      },
    }),

    this.prisma.review.findMany({
      where: {
        reviewedId: guestId,
        type: ReviewType.HOST_TO_GUEST,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 10,

      select: {
        id: true,
        bookingId: true,
        rating: true,
        comment: true,
        isVisible: true,
        createdAt: true,

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
          },
        },
      },
    }),

    // ───────── تقييم السكن نفسه ─────────

    this.prisma.review.aggregate({
      where: {
        listingId,
        type: ReviewType.GUEST_TO_LISTING,
      },

      _avg: {
        rating: true,
        cleanliness: true,
        location: true,
        accuracy: true,
        value: true,
      },

      _count: {
        id: true,
      },
    }),

    this.prisma.review.findMany({
      where: {
        listingId,
        type: ReviewType.GUEST_TO_LISTING,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 10,

      select: {
        id: true,
        bookingId: true,

        rating: true,
        cleanliness: true,
        location: true,
        accuracy: true,
        value: true,

        comment: true,
        isVisible: true,
        createdAt: true,

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
  ]);

  const host = dispute.listing.host;

  const listing = {
    id: dispute.listing.id,
    title: dispute.listing.title,
    description: dispute.listing.description,

    city: dispute.listing.city,
    governorate: dispute.listing.governorate,
    country: dispute.listing.country,

    monthlyRent: dispute.listing.monthlyRent,
    depositAmount: dispute.listing.depositAmount,

    status: dispute.listing.status,
    propertyType: dispute.listing.propertyType,
    roomType: dispute.listing.roomType,

    photos: dispute.listing.photos,

    ratingSummary: {
      totalReviews:
        listingAggregate._count.id,

      averageRating: Number(
        listingAggregate._avg.rating?.toFixed(1) ??
          0,
      ),

      averageCleanliness: Number(
        listingAggregate._avg.cleanliness?.toFixed(
          1,
        ) ?? 0,
      ),

      averageLocation: Number(
        listingAggregate._avg.location?.toFixed(
          1,
        ) ?? 0,
      ),

      averageAccuracy: Number(
        listingAggregate._avg.accuracy?.toFixed(
          1,
        ) ?? 0,
      ),

      averageValue: Number(
        listingAggregate._avg.value?.toFixed(1) ??
          0,
      ),
    },

    reviews: listingReviews,
  };

  return {
    booking: {
      id: dispute.id,
      status: dispute.status,

      preferredMoveInDate:
        dispute.preferredMoveInDate,

      guestMessage: dispute.guestMessage,
      agreedAmount: dispute.agreedAmount,
      hostResponseNote:
        dispute.hostResponseNote,

      disputeReason: dispute.disputeReason,
      disputeDescription:
        dispute.disputeDescription,

      disputeResolution:
        dispute.disputeResolution,

      acceptedAt: dispute.acceptedAt,
      confirmedAt: dispute.confirmedAt,
      disputedAt: dispute.disputedAt,

      disputeResolvedAt:
        dispute.disputeResolvedAt,

      cancelledAt: dispute.cancelledAt,
      completedAt: dispute.completedAt,

      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    },

    guest: {
  ...dispute.guest,

  phone: this.decryptPhone(
    dispute.guest.phone,
  ),

  ratingSummary: {
    totalReviews:
      guestAggregate._count.id,

    averageRating: Number(
      guestAggregate._avg.rating?.toFixed(1) ??
        0,
    ),

    lowRatingsCount:
      guestLowRatingsCount,

    hiddenReviewsCount:
      guestHiddenReviewsCount,
  },

  reviews: guestReviews,
},

    host: {
  ...host,

  phone: this.decryptPhone(host.phone),

  ratingSummary: {
    totalReviews:
      hostAggregate._count.id,

    averageRating: Number(
      hostAggregate._avg.rating?.toFixed(1) ??
        0,
    ),

    lowRatingsCount:
      hostLowRatingsCount,

    hiddenReviewsCount:
      hostHiddenReviewsCount,
  },

  reviews: hostReviews,
},

    listing,

    payment: dispute.payment
      ? {
          ...dispute.payment,

          /*
            القيم الأصلية الموجودة فوق بالقروش.
            amounts هنا بالجنيه للـ frontend.
          */
          amounts: {
            totalAmount:
              dispute.payment.amount / 100,

            rentAmount:
              dispute.payment.rentAmount / 100,

            securityDepositAmount:
              dispute.payment
                .securityDepositAmount / 100,

            platformFee:
              dispute.payment.platformFee / 100,

            hostPayoutAmount:
              dispute.payment.hostPayoutAmount /
              100,

            guestRefundAmount:
              dispute.payment.guestRefundAmount /
              100,

            hostCompensationAmount:
              dispute.payment
                .hostCompensationAmount / 100,

            currency:
              dispute.payment.currency,
          },
        }
      : null,
  };
}

async getDisputeMessages(
  bookingId: number,
  query: QueryDisputeMessagesDto,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const skip = (page - 1) * limit;

  // 1. نتأكد أن الحجز موجود ودخل في نزاع فعلًا
  const booking = await this.prisma.booking.findFirst({
    where: {
      id: bookingId,
      disputedAt: {
        not: null,
      },
    },

    select: {
      id: true,
      guestId: true,
      listingId: true,

      listing: {
        select: {
          id: true,
          title: true,
          hostId: true,
        },
      },
    },
  });

  if (!booking) {
    throw new NotFoundException('Dispute not found');
  }

  /*
    2. نبحث عن المحادثة الأصلية بين:

    المغترب الموجود في الحجز
    صاحب السكن صاحب العقار
    العقار المرتبط بالحجز
  */
  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        guestId_hostId_listingId: {
          guestId: booking.guestId,
          hostId: booking.listing.hostId,
          listingId: booking.listingId,
        },
      },

      select: {
        id: true,
        guestId: true,
        hostId: true,
        listingId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  /*
    ممكن يكون حصل حجز ونزاع من غير ما الطرفين
    يكونوا اتكلموا في الشات قبل كده.

    في الحالة دي نرجع قائمة فاضية بدل Error.
  */
  if (!conversation) {
    return {
      conversation: null,
      booking: {
        id: booking.id,
        listingId: booking.listingId,
        listingTitle: booking.listing.title,
        guestId: booking.guestId,
        hostId: booking.listing.hostId,
      },
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
      },
    };
  }

  /*
    الصفحة الأولى ترجع أحدث الرسائل.

    بنجيبها من الأحدث للأقدم من قاعدة البيانات،
    ثم نعمل reverse عشان تظهر داخل الصفحة
    بترتيب المحادثة الطبيعي.
  */
  const [messages, total] = await Promise.all([
    this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },

      skip,
      take: limit,

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        isRead: true,
        readAt: true,
        createdAt: true,

        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    }),

    this.prisma.message.count({
      where: {
        conversationId: conversation.id,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const formattedMessages = messages
    .reverse()
    .map((message) => {
      let senderType:
        | 'GUEST'
        | 'HOST'
        | 'UNKNOWN' = 'UNKNOWN';

      if (message.senderId === conversation.guestId) {
        senderType = 'GUEST';
      } else if (
        message.senderId === conversation.hostId
      ) {
        senderType = 'HOST';
      }

      return {
        ...message,
        senderType,
      };
    });

  return {
    conversation: {
      ...conversation,

      // الأدمن يقرأ المحادثة فقط في هذه المرحلة
      readOnly: true,
    },

    booking: {
      id: booking.id,
      listingId: booking.listingId,
      listingTitle: booking.listing.title,
      guestId: booking.guestId,
      hostId: booking.listing.hostId,
    },

    data: formattedMessages,

    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
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
        rooms: {
          include: { images: true },
          orderBy: { roomNumber: 'asc' as const },
        },
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

    const [listingWithCapacity] = await this.attachCapacityToListings([listing]);
    return listingWithCapacity;
  }


  async openDisputeConversation(
  bookingId: number,
  dto: OpenDisputeConversationDto,
) {
  // 1. التأكد أن الحجز موجود ودخل في نزاع
  const booking = await this.prisma.booking.findFirst({
    where: {
      id: bookingId,
      disputedAt: {
        not: null,
      },
    },
    select: {
      id: true,
      guestId: true,
      status: true,
      disputeReason: true,
      disputedAt: true,

      listing: {
        select: {
          id: true,
          title: true,
          hostId: true,
        },
      },
    },
  });

  if (!booking) {
    throw new NotFoundException('Dispute not found');
  }

  // 2. تحديد الشخص الذي يريد الأدمن مراسلته
  let participantId: number;

  if (
    dto.participantType ===
    DisputeParticipantType.GUEST
  ) {
    participantId = booking.guestId;
  } else if (
    dto.participantType ===
    DisputeParticipantType.HOST
  ) {
    participantId = booking.listing.hostId;
  } else {
    throw new BadRequestException(
      'Invalid dispute participant type',
    );
  }

  /*
    3. لو المحادثة موجودة نرجعها.
    لو غير موجودة ننشئها.

    @@unique([bookingId, participantType])
    هو الذي يمنع إنشاء محادثتين لنفس الطرف.
  */
  const conversation =
    await this.prisma.disputeConversation.upsert({
      where: {
        bookingId_participantType: {
          bookingId,
          participantType: dto.participantType,
        },
      },

      update: {
        // حماية لو participantId اتغير بسبب بيانات قديمة
        participantId,
      },

      create: {
        bookingId,
        participantId,
        participantType: dto.participantType,
      },

      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,

        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            role: true,
            verificationStatus: true,
          },
        },

        booking: {
          select: {
            id: true,
            status: true,
            disputeReason: true,
            disputedAt: true,

            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },

        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

  return {
    message:
      conversation._count.messages > 0
        ? 'Dispute conversation opened successfully'
        : 'Dispute conversation created successfully',

    conversation,
  };
}



async getPrivateDisputeConversationMessages(
  conversationId: number,
  query: QueryDisputeMessagesDto,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const skip = (page - 1) * limit;

  // 1. التأكد أن المحادثة موجودة
  const conversation =
    await this.prisma.disputeConversation.findUnique({
      where: {
        id: conversationId,
      },

      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,

        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            role: true,
            verificationStatus: true,
          },
        },

        booking: {
          select: {
            id: true,
            status: true,
            disputeReason: true,
            disputedAt: true,

            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

  if (!conversation) {
    throw new NotFoundException(
      'Dispute conversation not found',
    );
  }

  // عند فتح الأدمن للمحادثة:
// نعلّم رسائل المغترب أو صاحب السكن كمقروءة
const readAt = new Date();

await this.prisma.disputeMessage.updateMany({
  where: {
    conversationId,

    // نحدد رسائل الطرف الموجود في المحادثة فقط
    senderId: conversation.participantId,

    isRead: false,
  },

  data: {
    isRead: true,
    readAt,
  },
});

  // 2. جلب الرسائل من الأحدث للأقدم
  const [messages, total] = await Promise.all([
    this.prisma.disputeMessage.findMany({
      where: {
        conversationId,
      },

      skip,
      take: limit,

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        isRead: true,
        readAt: true,
        createdAt: true,

        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    }),

    this.prisma.disputeMessage.count({
      where: {
        conversationId,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  /*
    لأننا جبنا أحدث الرسائل أولًا،
    بنعكس القائمة عشان تظهر في ترتيب الشات الطبيعي.
  */
  const formattedMessages = messages
    .reverse()
    .map((message) => ({
      ...message,

      senderType:
        message.sender.role === 'ADMIN'
          ? 'ADMIN'
          : message.senderId ===
              conversation.participantId
            ? conversation.participantType
            : 'UNKNOWN',
    }));

  return {
    conversation,
    data: formattedMessages,

    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
}



async sendPrivateDisputeMessage(
  conversationId: number,
  adminId: number,
  dto: SendDisputeMessageDto,
) {
  // 1. التأكد أن المستخدم الحالي Admin فعلًا
  const admin = await this.prisma.user.findUnique({
    where: {
      id: adminId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin) {
    throw new NotFoundException('Admin user not found');
  }

  if (admin.role !== 'ADMIN') {
    throw new ForbiddenException(
      'Only admins can send messages in this conversation',
    );
  }

  if (!admin.isActive) {
    throw new ForbiddenException(
      'Your admin account is inactive',
    );
  }

  // 2. التأكد أن المحادثة الخاصة موجودة
  const conversation =
    await this.prisma.disputeConversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,

        booking: {
          select: {
            id: true,
            disputedAt: true,
            status: true,
          },
        },
      },
    });

  if (!conversation) {
    throw new NotFoundException(
      'Dispute conversation not found',
    );
  }

  // 3. منع الإرسال بعد إغلاق المحادثة
  if (conversation.isClosed) {
    throw new BadRequestException(
      'This dispute conversation is closed',
    );
  }

  // حماية إضافية: المحادثة لازم تكون مرتبطة بحجز دخل في نزاع
  if (!conversation.booking.disputedAt) {
    throw new BadRequestException(
      'This booking does not have a dispute',
    );
  }

  const content = dto.content.trim();

  if (!content) {
    throw new BadRequestException(
      'Message content cannot be empty',
    );
  }

  // 4. حفظ الرسالة وتحديث وقت المحادثة
  const message = await this.prisma.$transaction(
    async (tx) => {
      const createdMessage =
        await tx.disputeMessage.create({
          data: {
            conversationId,
            senderId: adminId,
            content,
            isRead: false,
          },

          select: {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            isRead: true,
            readAt: true,
            createdAt: true,

            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        });

      /*
        إنشاء Message لا يحدّث updatedAt للمحادثة تلقائيًا،
        لذلك نحدّث المحادثة حتى تظهر كأحدث محادثة.
      */
      await tx.disputeConversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return createdMessage;
    },
  );

  return {
    message: 'Message sent successfully',

    data: {
      ...message,
      senderType: 'ADMIN',

      recipient: {
        id: conversation.participantId,
        type: conversation.participantType,
      },
    },
  };
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

  async closeDisputeConversation(
  conversationId: number,
) {
  const conversation =
    await this.prisma.disputeConversation.findUnique({
      where: {
        id: conversationId,
      },

      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,

        booking: {
          select: {
            id: true,
            status: true,
            disputedAt: true,
          },
        },
      },
    });

  if (!conversation) {
    throw new NotFoundException(
      'Dispute conversation not found',
    );
  }

  // لو المحادثة مقفولة بالفعل، ما نعملش تحديث جديد
  if (conversation.isClosed) {
    return {
      message:
        'Dispute conversation is already closed',

      conversation,
    };
  }

  const updatedConversation =
    await this.prisma.disputeConversation.update({
      where: {
        id: conversationId,
      },

      data: {
        isClosed: true,
      },

      select: {
        id: true,
        bookingId: true,
        participantId: true,
        participantType: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,

        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

  return {
    message:
      'Dispute conversation closed successfully',

    conversation: updatedConversation,
  };
}
}
