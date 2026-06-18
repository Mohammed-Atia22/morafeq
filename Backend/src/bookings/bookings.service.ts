import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  ListingStatus,
   PaymentStatus,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReportBookingProblemDto } from './dto/report-booking-problem.dto';
import {
  BookingResponseAction,
  RespondBookingDto,
} from './dto/respond-booking.dto';



@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

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
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not available');
    }

    if (listing.hostId === guestId) {
      throw new ForbiddenException('You cannot book your own listing');
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

    const activeBooking = await this.prisma.booking.findFirst({
  where: {
    listingId: dto.listingId,
    status: {
      in: [
        BookingStatus.PENDING_PAYMENT,
        BookingStatus.CHECK_IN_PENDING,
        BookingStatus.DISPUTED,
        BookingStatus.COMPLETED,
      ],
    },
  },
});

if (activeBooking) {
  throw new ConflictException(
    'This listing is already reserved or booked',
  );
}

  
    return this.prisma.booking.create({
      data: {
        guestId,
        listingId: dto.listingId,
        preferredMoveInDate: dto.preferredMoveInDate
          ? new Date(dto.preferredMoveInDate)
          : null,
        guestMessage: dto.guestMessage,
        status: BookingStatus.PENDING_HOST_APPROVAL,
      },
      include: this.bookingIncludes(),
    });
  }

  async respond(bookingId: number, hostId: number, dto: RespondBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.listing.hostId !== hostId) {
      throw new ForbiddenException(
        'You do not have permission to respond to this booking',
      );
    }

    if (booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException(
        `Cannot respond to a booking with status: ${booking.status}`,
      );
    }

    if (dto.action === BookingResponseAction.ACCEPT) {
      return this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PENDING_PAYMENT,
          agreedAmount: booking.listing.monthlyRent,
          hostResponseNote: dto.note,
          acceptedAt: new Date(),
        },
        include: this.bookingIncludes(),
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        rejectionReason: dto.note,
        rejectedAt: new Date(),
      },
      include: this.bookingIncludes(),
    });
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
      BookingStatus.CANCELLED_BY_GUEST,
      BookingStatus.CANCELLED_BY_HOST,
      BookingStatus.REJECTED,
    ];

    if (nonCancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel a booking with status: ${booking.status}`,
      );
    }

    return this.prisma.booking.update({
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

    return booking;
  }

  async findGuestBookings(guestId: number) {
    return this.prisma.booking.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
      include: this.bookingIncludes(),
    });
  }

  async findHostBookings(hostId: number, status?: BookingStatus) {
    return this.prisma.booking.findMany({
      where: {
        listing: { hostId },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: this.bookingIncludes(),
    });
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


  async confirmReceipt(
  bookingId: number,
  guestId: number,
) {
  const booking =
    await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        payment: true,
      },
    });

  if (!booking) {
    throw new NotFoundException(
      'Booking not found',
    );
  }

  if (booking.guestId !== guestId) {
    throw new ForbiddenException(
      'Only the guest can confirm receiving the property',
    );
  }

  if (
    booking.status !==
    BookingStatus.CHECK_IN_PENDING
  ) {
    throw new BadRequestException(
      `Cannot confirm receipt with booking status: ${booking.status}`,
    );
  }

  if (
    !booking.payment ||
    booking.payment.status !== PaymentStatus.HELD
  ) {
    throw new BadRequestException(
      'No held payment found for this booking',
    );
  }

  return this.prisma.$transaction(
    async (tx) => {
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
      return tx.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: this.bookingIncludes(),
      });
    },
  );
}



async reportProblem(
  bookingId: number,
  guestId: number,
  dto: ReportBookingProblemDto,
) {
  const booking =
    await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        payment: true,
      },
    });

  if (!booking) {
    throw new NotFoundException(
      'Booking not found',
    );
  }

  if (booking.guestId !== guestId) {
    throw new ForbiddenException(
      'Only the guest can report a problem',
    );
  }

  if (
    booking.status !==
    BookingStatus.CHECK_IN_PENDING
  ) {
    throw new BadRequestException(
      'A problem can only be reported while waiting for check-in',
    );
  }

  if (
    !booking.payment ||
    booking.payment.status !== PaymentStatus.HELD
  ) {
    throw new BadRequestException(
      'No held payment found for this booking',
    );
  }

  // لا نغير Payment:
  // تظل HELD إلى أن يقرر الأدمن
  return this.prisma.booking.update({
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
}

  async getHostStats(hostId: number) {
    const [pending, awaitingCheckIn, completed, total] =
  await Promise.all([
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
          monthlyRent: true,
          city: true,
          governorate: true,
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
    };
  }
}
