import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RespondBookingDto, BookingResponseAction } from './dto/respond-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BookingStatus, ListingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  // ─── Guest creates a booking request ──────

  async create(guestId: number, dto: CreateBookingDto) {
    // 1. find the listing
    const listing = await this.prisma.listing.findFirst({
      where: {
        id:        dto.listingId,
        isDeleted: false,
        status:    ListingStatus.APPROVED,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not available');
    }

    // 2. guest cannot book their own listing
    if (listing.hostId === guestId) {
      throw new ForbiddenException('You cannot book your own listing');
    }

    // 3. check guest does not already have an active booking on this listing
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        guestId,
        listingId: dto.listingId,
        status: {
          in: [
            BookingStatus.PENDING_HOST_APPROVAL,
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
          ],
        },
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'You already have an active booking request for this listing',
      );
    }

    // 4. check listing does not already have a confirmed booking
    const confirmedBooking = await this.prisma.booking.findFirst({
      where: {
        listingId: dto.listingId,
        status:    BookingStatus.CONFIRMED,
      },
    });

    if (confirmedBooking) {
      throw new ConflictException('This listing is already booked');
    }

    // 5. create the booking
    const booking = await this.prisma.booking.create({
      data: {
        guestId,
        listingId:           dto.listingId,
        preferredMoveInDate: dto.preferredMoveInDate
          ? new Date(dto.preferredMoveInDate)
          : null,
        guestMessage: dto.guestMessage,
        status:       BookingStatus.PENDING_HOST_APPROVAL,
      },
      include: {
        listing: {
          select: {
            id:          true,
            title:       true,
            monthlyRent: true,
            city:        true,
            governorate: true,
            host: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        guest: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return booking;
  }

  // ─── Host responds (accept or reject) ─────

  async respond(bookingId: number, hostId: number, dto: RespondBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // verify the host owns the listing
    if (booking.listing.hostId !== hostId) {
      throw new ForbiddenException(
        'You do not have permission to respond to this booking',
      );
    }

    // only pending bookings can be responded to
    if (booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException(
        `Cannot respond to a booking with status: ${booking.status}`,
      );
    }

    if (dto.action === BookingResponseAction.ACCEPT) {
      // accepting moves to PENDING_PAYMENT
      return this.prisma.booking.update({
        where: { id: bookingId },
        data:  {
          status:          BookingStatus.PENDING_PAYMENT,
          hostResponseNote: dto.note,
          acceptedAt:      new Date(),
        },
        include: this.bookingIncludes(),
      });
    }

    // rejecting
    return this.prisma.booking.update({
      where: { id: bookingId },
      data:  {
        status:          BookingStatus.REJECTED,
        rejectionReason: dto.note,
        rejectedAt:      new Date(),
      },
      include: this.bookingIncludes(),
    });
  }

  // ─── Cancel booking ────────────────────────

  async cancel(bookingId: number, userId: number, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isGuest = booking.guestId === userId;
    const isHost  = booking.listing.hostId === userId;

    // only guest or host can cancel
    if (!isGuest && !isHost) {
      throw new ForbiddenException(
        'You do not have permission to cancel this booking',
      );
    }

    // cannot cancel already completed or already cancelled bookings
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

    const newStatus = isGuest
      ? BookingStatus.CANCELLED_BY_GUEST
      : BookingStatus.CANCELLED_BY_HOST;

    return this.prisma.booking.update({
      where: { id: bookingId },
      data:  {
        status:            newStatus,
        cancellationReason: dto.reason,
        cancelledAt:       new Date(),
      },
      include: this.bookingIncludes(),
    });
  }

  // ─── Get single booking ────────────────────

  async findOne(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: {
        ...this.bookingIncludes(),
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // only guest or host can view
    const isGuest = booking.guestId === userId;
    const isHost  = (booking.listing as any).host?.id === userId;

    if (!isGuest && !isHost) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return booking;
  }

  // ─── Guest: get my bookings ────────────────

  async findGuestBookings(guestId: number) {
    return this.prisma.booking.findMany({
      where:   { guestId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id:          true,
            title:       true,
            monthlyRent: true,
            city:        true,
            governorate: true,
            photos: {
              where: { isCover: true },
              take:  1,
            },
            host: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  // ─── Host: get booking requests ───────────

  async findHostBookings(hostId: number, status?: BookingStatus) {
    return this.prisma.booking.findMany({
      where: {
        listing: { hostId },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id:    true,
            title: true,
            city:  true,
            photos: {
              where: { isCover: true },
              take:  1,
            },
          },
        },
        guest: {
          select: {
            id:        true,
            firstName: true,
            lastName:  true,
            avatarUrl: true,
            email:     true,
          },
        },
      },
    });
  }

  // ─── Mark booking as completed ─────────────

  async complete(bookingId: number, hostId: number) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.listing.hostId !== hostId) {
      throw new ForbiddenException('Only the host can mark a booking as completed');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be completed');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data:  {
        status:      BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: this.bookingIncludes(),
    });
  }

  // ─── Get booking counts for host ──────────

  async getHostStats(hostId: number) {
    const [pending, confirmed, completed, total] = await Promise.all([
      this.prisma.booking.count({
        where: { listing: { hostId }, status: BookingStatus.PENDING_HOST_APPROVAL },
      }),
      this.prisma.booking.count({
        where: { listing: { hostId }, status: BookingStatus.CONFIRMED },
      }),
      this.prisma.booking.count({
        where: { listing: { hostId }, status: BookingStatus.COMPLETED },
      }),
      this.prisma.booking.count({
        where: { listing: { hostId } },
      }),
    ]);

    return { pending, confirmed, completed, total };
  }

  // ─── Private: reusable include ─────────────

  private bookingIncludes() {
    return {
      listing: {
        select: {
          id:          true,
          title:       true,
          monthlyRent: true,
          city:        true,
          governorate: true,
          photos: {
            where: { isCover: true },
            take:  1,
          },
          host: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      guest: {
        select: {
          id:        true,
          firstName: true,
          lastName:  true,
          avatarUrl: true,
          email:     true,
        },
      },
      payment: true,
    };
  }
}