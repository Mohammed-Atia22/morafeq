import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  BookingStatus,
  ListingStatus,
  PaymentStatus,
  VerificationStatus,
  NotificationType 
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReportBookingProblemDto } from './dto/report-booking-problem.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BookingResponseAction,
  RespondBookingDto,
} from './dto/respond-booking.dto';
import {
  calculateCapacity,
  CAPACITY_HOLDING_BOOKING_STATUSES,
  getPaymentExpiresAt,
  isRoomBasedListing,
  areAllRoomsFull,
} from './booking-capacity';

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsService.name);
  private expirationTimer?: NodeJS.Timeout;
  private readonly expirationCheckMs = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
  private readonly notificationsService: NotificationsService,
) {}

  onModuleInit() {
    this.expireUnpaidApprovedBookings().catch((error) =>
      this.logger.error('Failed to expire unpaid bookings on startup', error),
    );

    this.expirationTimer = setInterval(() => {
      this.expireUnpaidApprovedBookings().catch((error) =>
        this.logger.error('Failed to expire unpaid bookings', error),
      );
    }, this.expirationCheckMs);
  }

  onModuleDestroy() {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
  }

  async create(guestId: number, dto: CreateBookingDto) {
    const guest = await this.prisma.user.findUnique({
      where: { id: guestId },
      select: {
        verificationStatus: true,
        verification: {
          select: { status: true },
        },
      },
    });

    const guestVerificationStatus =
      guest?.verification?.status ?? guest?.verificationStatus;

    if (guestVerificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'You need to verify your identity before making a booking',
      );
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: dto.listingId,
        isDeleted: false,
        status: { in: [ListingStatus.APPROVED, ListingStatus.ACTIVE] },
      },
      include: {
        rooms: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not available');
    }

    if (listing.hostId === guestId) {
      throw new ForbiddenException('You cannot book your own listing');
    }

    let selectedRoomName: string | undefined;

    if (isRoomBasedListing(listing)) {
      if (!dto.roomId) {
        throw new BadRequestException(
          'يرجى اختيار الغرفة المناسبة قبل إرسال طلب الحجز',
        );
      }

      const selectedRoom = listing.rooms.find((room) => room.id === dto.roomId);

      if (!selectedRoom) {
        throw new BadRequestException('الغرفة المختارة غير تابعة لهذا العقار');
      }

      if (selectedRoom.occupiedCount >= selectedRoom.capacity) {
        throw new ConflictException(
          'هذه الغرفة ممتلئة، يرجى اختيار غرفة أخرى.',
        );
      }

      selectedRoomName = selectedRoom.roomName;
    }

    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        guestId,
        listingId: dto.listingId,
        status: {
          in: [
            BookingStatus.PENDING_HOST_APPROVAL,
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CHECK_IN_PENDING,
            BookingStatus.DISPUTED,
          ],
        },
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'You already have an active booking request for this listing',
      );
    }

    const activeReservedPlaces = await this.countReservedPlaces(dto.listingId);
    const capacity = calculateCapacity(
      listing.maxTenants,
      activeReservedPlaces,
    );

    if (capacity.isFull) {
      throw new ConflictException('لا توجد أماكن متاحة في هذا العقار حاليا');
    }

    const created = await this.prisma.booking.create({
      data: {
        guestId,
        listingId: dto.listingId,
        preferredMoveInDate: dto.preferredMoveInDate
          ? new Date(dto.preferredMoveInDate)
          : null,
        guestMessage: dto.guestMessage,
        roomId: isRoomBasedListing(listing) ? (dto.roomId ?? null) : null,
        selectedRoomName,
        status: BookingStatus.PENDING_HOST_APPROVAL,
      },
      include: this.bookingIncludes(),
    });

    try {
  await this.notificationsService.notifyUser({
    userId: created.listing.host.id,

    type: NotificationType.BOOKING_REQUESTED,

    title: 'طلب حجز جديد',

    message:
      `لديك طلب حجز جديد على العقار "${created.listing.title}" من ${created.guest.firstName} ${created.guest.lastName}. يرجى مراجعة الطلب والرد عليه.`,

    relatedEntity: 'booking',
    relatedEntityId: created.id,

    metadata: {
      bookingId: created.id,
      listingId: created.listing.id,
      listingTitle: created.listing.title,
      guestId: created.guest.id,
      guestName:
        `${created.guest.firstName} ${created.guest.lastName}`,
    },

    shouldSendEmail: true,

    emailSubject:
      `طلب حجز جديد على عقارك: ${created.listing.title}`,
  });
} catch (notificationError) {
  this.logger.error(
    'Failed to send booking request notification',
    notificationError,
  );
}

return this.sanitizeBookingForUser(created, guestId);
  }



  async respond(
  bookingId: number,
  hostId: number,
  dto: RespondBookingDto,
) {
  const booking = await this.prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true, room: true },
  });

  if (!booking) {
    throw new NotFoundException('Booking not found');
  }

  if (booking.listing.hostId !== hostId) {
    throw new ForbiddenException(
      'You do not have permission to respond to this booking',
    );
  }

  if (
    booking.status !==
    BookingStatus.PENDING_HOST_APPROVAL
  ) {
    throw new BadRequestException(
      `Cannot respond to a booking with status: ${booking.status}`,
    );
  }

  if (dto.action === BookingResponseAction.ACCEPT) {
    const activeReservedPlaces =
      await this.countReservedPlaces(
        booking.listingId,
      );

    const capacity = calculateCapacity(
      booking.listing.maxTenants,
      activeReservedPlaces,
    );

    if (capacity.isFull) {
      throw new ConflictException(
        'لا توجد أماكن متاحة في هذا العقار حاليا ولا يمكن قبول طلب آخر',
      );
    }

    const updatedBooking =
      await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const paymentExpiresAt =
          getPaymentExpiresAt(now);

        if (booking.roomId) {
          const room = await tx.room.findUnique({
            where: { id: booking.roomId },
          });

          if (
            !room ||
            room.apartmentId !== booking.listingId
          ) {
            throw new BadRequestException(
              'الغرفة المختارة غير متاحة لهذا العقار',
            );
          }

          if (
            room.occupiedCount >= room.capacity
          ) {
            throw new ConflictException(
              'هذه الغرفة ممتلئة، يرجى اختيار غرفة أخرى.',
            );
          }

          await tx.room.update({
            where: { id: room.id },
            data: {
              occupiedCount: {
                increment: 1,
              },
            },
          });
        }

        const acceptedBooking =
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status:
                BookingStatus.PENDING_PAYMENT,

              agreedAmount:
                booking.listing.monthlyRent,

              hostResponseNote: dto.note,
              acceptedAt: now,
              approvedAt: now,
              paymentExpiresAt,
            },
            include: this.bookingIncludes(),
          });

        await this.recalculateListingVisibility(
          tx,
          booking.listingId,
        );

        return acceptedBooking;
      });

    try {
      await this.notificationsService.notifyUser({
        userId: updatedBooking.guest.id,

        type: NotificationType.BOOKING_APPROVED,

        title: 'تم قبول طلب الحجز',

        message:
          `تم قبول طلب حجزك للعقار "${updatedBooking.listing.title}". يرجى استكمال الدفع خلال ساعة واحدة لتأكيد الحجز، وإلا سيتم إلغاء الحجز تلقائيًا.`,

        relatedEntity: 'booking',
        relatedEntityId: updatedBooking.id,

        metadata: {
          bookingId: updatedBooking.id,
          listingId: updatedBooking.listing.id,
          listingTitle:
            updatedBooking.listing.title,

          status:
            BookingStatus.PENDING_PAYMENT,

          paymentRequired: true,

          paymentExpiresAt:
            updatedBooking.paymentExpiresAt
              ? updatedBooking.paymentExpiresAt.toISOString()
              : null,
        },

        shouldSendEmail: true,

        emailSubject:
          `تم قبول طلب حجزك: ${updatedBooking.listing.title}`,
      });
    } catch (notificationError) {
      this.logger.error(
        'Failed to send booking approval notification',
        notificationError,
      );
    }

    return updatedBooking;
  }

  const rejectedBooking =
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        rejectionReason: dto.note,
        rejectedAt: new Date(),
      },
      include: this.bookingIncludes(),
    });

  try {
    await this.notificationsService.notifyUser({
      userId: rejectedBooking.guest.id,

      type: NotificationType.BOOKING_REJECTED,

      title: 'تم رفض طلب الحجز',

      message:
        `نأسف، تم رفض طلب حجزك للعقار "${rejectedBooking.listing.title}".${
          dto.note
            ? `\n\nسبب الرفض:\n${dto.note}`
            : ''
        }`,

      relatedEntity: 'booking',
      relatedEntityId: rejectedBooking.id,

      metadata: {
        bookingId: rejectedBooking.id,
        listingId: rejectedBooking.listing.id,
        listingTitle:
          rejectedBooking.listing.title,

        status: BookingStatus.REJECTED,

        rejectionReason: dto.note ?? null,
      },

      shouldSendEmail: true,

      emailSubject:
        `تحديث بشأن طلب حجزك: ${rejectedBooking.listing.title}`,
    });
  } catch (notificationError) {
    this.logger.error(
      'Failed to send booking rejection notification',
      notificationError,
    );
  }

  return rejectedBooking;
}

  async cancel(bookingId: number, userId: number, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.hostId === userId;

    if (!isGuest && !isHost) {
      throw new ForbiddenException(
        'You do not have permission to cancel this booking',
      );
    }

    const nonCancellableStatuses: BookingStatus[] = [
      BookingStatus.COMPLETED,
      BookingStatus.EXPIRED,
      BookingStatus.CANCELED,
      BookingStatus.CANCELLED_BY_GUEST,
      BookingStatus.CANCELLED_BY_HOST,
      BookingStatus.REJECTED,
    ];

    if (nonCancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel a booking with status: ${booking.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: isGuest
            ? BookingStatus.CANCELLED_BY_GUEST
            : BookingStatus.CANCELLED_BY_HOST,
          cancellationReason: dto.reason,
          cancelledAt: new Date(),
        },
        include: this.bookingIncludes(),
      });

      if (CAPACITY_HOLDING_BOOKING_STATUSES.includes(booking.status)) {
        await this.releaseRoomPlaceIfNeeded(tx, booking.roomId);
        await this.recalculateListingVisibility(tx, booking.listingId);
      }

      return updatedBooking;
    });

    return this.sanitizeBookingForUser(updated, userId);
  }

  async expireUnpaidApprovedBookings() {
    const now = new Date();

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        OR: [
          { paymentExpiresAt: { lte: now } },
          {
            paymentExpiresAt: null,
            approvedAt: { lte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        ],
        AND: {
          OR: [
            { payment: null },
            {
              payment: {
                status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
              },
            },
          ],
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            hostId: true,
          },
        },
      },
    });

    for (const booking of expiredBookings) {
      await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: BookingStatus.PENDING_PAYMENT,
            OR: [
              { paymentExpiresAt: { lte: now } },
              {
                paymentExpiresAt: null,
                approvedAt: { lte: new Date(now.getTime() - 60 * 60 * 1000) },
              },
            ],
            AND: {
              OR: [
                { payment: null },
                {
                  payment: {
                    status: {
                      in: [PaymentStatus.PENDING, PaymentStatus.FAILED],
                    },
                  },
                },
              ],
            },
          },
          data: {
            status: BookingStatus.EXPIRED,
            cancellationReason: 'انتهت مهلة الدفع الخاصة بالحجز.',
            cancelledAt: now,
          },
        });

        if (updateResult.count === 0) {
          return;
        }

        await this.releaseRoomPlaceIfNeeded(tx, booking.roomId);
        await this.recalculateListingVisibility(tx, booking.listingId);
      });
    }

    if (expiredBookings.length > 0) {
      this.logger.log(`Expired ${expiredBookings.length} unpaid booking(s)`);
    }
  }

  async findOne(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.bookingIncludes(),
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isGuest = booking.guestId === userId;
    const isHost = (booking.listing as any).host?.id === userId;

    if (!isGuest && !isHost) {
      throw new ForbiddenException(
        'You do not have permission to view this booking',
      );
    }

    return this.sanitizeBookingForUser(booking, userId);
  }

  async findGuestBookings(guestId: number) {
    const bookings = await this.prisma.booking.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
      include: this.bookingIncludes(),
    });

    return bookings.map((b) => this.sanitizeBookingForUser(b, guestId));
  }

  async findHostBookings(hostId: number, status?: BookingStatus) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        listing: { hostId },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: this.bookingIncludes(),
    });

    return bookings.map((b) => this.sanitizeBookingForUser(b, hostId));
  }

  // async complete(bookingId: number, hostId: number) {
  //   const booking = await this.prisma.booking.findUnique({
  //     where: { id: bookingId },
  //     include: { listing: true },
  //   });

  //   if (!booking) throw new NotFoundException('Booking not found');

  //   if (booking.listing.hostId !== hostId) {
  //     throw new ForbiddenException('Only the host can mark a booking as completed');
  //   }

  //   if (booking.status !== BookingStatus.CONFIRMED) {
  //     throw new BadRequestException('Only confirmed bookings can be completed');
  //   }

  //   return this.prisma.booking.update({
  //     where: { id: bookingId },
  //     data: {
  //       status: BookingStatus.COMPLETED,
  //       completedAt: new Date(),
  //     },
  //     include: this.bookingIncludes(),
  //   });
  // }

  async confirmReceipt(bookingId: number, guestId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== guestId) {
      throw new ForbiddenException(
        'Only the guest can confirm receiving the property',
      );
    }

    if (booking.status !== BookingStatus.CHECK_IN_PENDING) {
      throw new BadRequestException(
        `Cannot confirm receipt with booking status: ${booking.status}`,
      );
    }

    if (!booking.payment || booking.payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('No held payment found for this booking');
    }

    return this.prisma.$transaction(async (tx) => {
      // أولًا: تحرير المبلغ لصاحب السكن
      await tx.payment.update({
        where: {
          bookingId,
        },
        data: {
          status: PaymentStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      // ثانيًا: إكمال الحجز
      const result = await tx.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: this.bookingIncludes(),
      });

      return this.sanitizeBookingForUser(result, guestId);
    });
  }

  async reportProblem(
    bookingId: number,
    guestId: number,
    dto: ReportBookingProblemDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== guestId) {
      throw new ForbiddenException('Only the guest can report a problem');
    }

    if (booking.status !== BookingStatus.CHECK_IN_PENDING) {
      throw new BadRequestException(
        'A problem can only be reported while waiting for check-in',
      );
    }

    if (!booking.payment || booking.payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('No held payment found for this booking');
    }

    // لا نغير Payment:
    // تظل HELD إلى أن يقرر الأدمن
    const updated = await this.prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: BookingStatus.DISPUTED,

        disputeReason: dto.reason,
        disputeDescription: dto.description,
        disputedAt: new Date(),
      },
      include: this.bookingIncludes(),
    });

    return this.sanitizeBookingForUser(updated, guestId);
  }

  async continueAfterDisputeResolution(bookingId: number, guestId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== guestId) {
      throw new ForbiddenException(
        'You can only respond to your own dispute resolution',
      );
    }

    if (booking.status !== BookingStatus.DISPUTE_RESOLVED_FOR_HOST) {
      throw new BadRequestException(
        'لا يوجد قرار نزاع بانتظار ردك على هذا الحجز',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECK_IN_PENDING,
      },
      include: this.bookingIncludes(),
    });

    return this.sanitizeBookingForUser(updated, guestId);
  }

  async getHostStats(hostId: number) {
    const [pending, awaitingCheckIn, completed, total] = await Promise.all([
      this.prisma.booking.count({
        where: {
          listing: { hostId },
          status: BookingStatus.PENDING_HOST_APPROVAL,
        },
      }),

      this.prisma.booking.count({
        where: {
          listing: { hostId },
          status: BookingStatus.CHECK_IN_PENDING,
        },
      }),

      this.prisma.booking.count({
        where: {
          listing: { hostId },
          status: BookingStatus.COMPLETED,
        },
      }),

      this.prisma.booking.count({
        where: {
          listing: { hostId },
        },
      }),
    ]);

    return {
      pending,
      awaitingCheckIn,
      completed,
      total,
    };
  }

  private bookingIncludes() {
    return {
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          monthlyRent: true,
          maxTenants: true,
          city: true,
          governorate: true,
          streetName: true,
          buildingNumber: true,
          floorNumber: true,
          apartmentNumber: true,
          nearbyLandmark: true,
          googleFormattedAddress: true,
          googlePlaceId: true,
          lat: true,
          lng: true,
          arrivalInstructions: true,
          rooms: {
            include: {
              images: true,
            },
            orderBy: { roomNumber: 'asc' as const },
          },
          photos: {
            where: { isCover: true },
            take: 1,
          },
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verificationStatus: true,
              phone: true,
              phoneCountry: true,
              phoneCountryCode: true,
              email: true,
            },
          },
        },
      },
      guest: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          email: true,
          verificationStatus: true,
        },
      },
      payment: true,
      room: {
        include: {
          images: true,
        },
      },
    };
  }

  private sanitizeBookingForUser(booking: any, userId: number) {
    if (!booking) return booking;
    const currentUserId = Number(userId);
    const isHost = Number((booking.listing as any).host?.id) === currentUserId;
    const isGuest = booking.guestId === currentUserId;

    if (isHost) return booking;

    if (isGuest) {
      // robust check: coerce enums/strings to uppercase strings to avoid mismatches
      const paymentStatus = String(booking.payment?.status ?? '').toUpperCase();
      const bookingStatus = String(booking.status ?? '').toUpperCase();

      const hasAccess =
        paymentStatus === 'HELD' && bookingStatus === 'CHECK_IN_PENDING';

      this.logger.debug(
        `sanitizeBookingForUser: booking=${booking.id} user=${currentUserId} isGuest=${isGuest} paymentStatus=${paymentStatus} bookingStatus=${bookingStatus} hasAccess=${hasAccess}`,
      );

      if (hasAccess) return booking;

      // mask sensitive listing and host contact info
      const maskedListing = {
        ...booking.listing,
        streetName: null,
        buildingNumber: null,
        floorNumber: null,
        apartmentNumber: null,
        nearbyLandmark: null,
        googleFormattedAddress: null,
        googlePlaceId: null,
        lat: null,
        lng: null,
        arrivalInstructions: null,
        host: {
          id: booking.listing.host.id,
          firstName: booking.listing.host.firstName,
          lastName: booking.listing.host.lastName,
          avatarUrl: booking.listing.host.avatarUrl,
          verificationStatus: booking.listing.host.verificationStatus,
        },
      };

      return {
        ...booking,
        listing: maskedListing,
      };
    }

    return booking;
  }

  private async countReservedPlaces(listingId: number) {
    return this.prisma.booking.count({
      where: {
        listingId,
        status: {
          in: CAPACITY_HOLDING_BOOKING_STATUSES,
        },
      },
    });
  }

  private async recalculateListingVisibility(tx: any, listingId: number) {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      select: {
        maxTenants: true,
        status: true,
        roomType: true,
        rooms: {
          select: {
            capacity: true,
            occupiedCount: true,
          },
        },
      },
    });

    if (!listing) {
      return;
    }

    const reservedPlaces = await tx.booking.count({
      where: {
        listingId,
        status: {
          in: CAPACITY_HOLDING_BOOKING_STATUSES,
        },
      },
    });

    const capacity = calculateCapacity(listing.maxTenants, reservedPlaces);
    const allRoomsFull = areAllRoomsFull(listing);

    if (
      (capacity.isFull || allRoomsFull) &&
      listing.status !== ListingStatus.RESERVED
    ) {
      await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.RESERVED },
      });
      return;
    }

    if (
      !capacity.isFull &&
      !allRoomsFull &&
      listing.status === ListingStatus.RESERVED
    ) {
      await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.ACTIVE },
      });
    }
  }

  private async releaseRoomPlaceIfNeeded(tx: any, roomId?: number | null) {
    if (!roomId) {
      return;
    }

    const room = await tx.room.findUnique({
      where: { id: roomId },
      select: { occupiedCount: true },
    });

    if (!room || room.occupiedCount <= 0) {
      return;
    }

    await tx.room.update({
      where: { id: roomId },
      data: { occupiedCount: { decrement: 1 } },
    });
  }

  private async createBookingMessage(
    tx: any,
    guestId: number,
    hostId: number,
    listingId: number,
    content: string,
    senderId = hostId,
  ) {
    const conversation = await tx.conversation.upsert({
      where: {
        guestId_hostId_listingId: {
          guestId,
          hostId,
          listingId,
        },
      },
      create: {
        guestId,
        hostId,
        listingId,
      },
      update: {},
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content,
      },
    });
  }
}
