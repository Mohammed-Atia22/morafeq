import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';
import { ReleasePaymentDto } from './dto/release-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly integrationId: string;
  private readonly iframeId: string;
  private readonly hmacSecret: string;
  private readonly platformFeePercent = 5; // 5% platform fee

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get('PAYMOB_BASE_URL') ?? 'https://accept.paymob.com/api';
    this.apiKey = this.config.getOrThrow('PAYMOB_API_KEY');
    this.integrationId = this.config.getOrThrow('PAYMOB_INTEGRATION_ID');
    this.iframeId = this.config.getOrThrow('PAYMOB_IFRAME_ID');
    this.hmacSecret = this.config.getOrThrow('PAYMOB_HMAC_SECRET');
  }

  // ─── Step 1: Get Paymob auth token ─────────

  private async getAuthToken(): Promise<string> {
    try {
      const res = await axios.post(`${this.baseUrl}/auth/tokens`, {
        api_key: this.apiKey,
      });
      return res.data.token;
    } catch {
      throw new InternalServerErrorException(
        'Failed to authenticate with payment provider',
      );
    }
  }

  // ─── Step 2: Create Paymob order ───────────

  private async createOrder(
    authToken: string,
    amountCents: number,
    paymobOrderData: any,
  ): Promise<string> {
    try {
      const res = await axios.post(`${this.baseUrl}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: paymobOrderData.merchantOrderId,
        items: [],
      });
      return String(res.data.id);
    } catch {
      throw new InternalServerErrorException(
        'Failed to create order with payment provider',
      );
    }
  }

  // ─── Step 3: Get payment key ────────────────

  private async getPaymentKey(
    authToken: string,
    orderId: string,
    amountCents: number,
    billingData: any,
  ): Promise<string> {
    try {
      const res = await axios.post(`${this.baseUrl}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600, // 1 hour
        order_id: Number(orderId),
        currency: 'EGP',
        integration_id: Number(this.integrationId),
        billing_data: billingData,
      });
      return res.data.token;
    } catch (error: any) {
  console.error('Paymob payment key error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
  });

  throw new InternalServerErrorException(
    error.response?.data?.message ||
      error.response?.data?.detail ||
      'Failed to get payment key from provider',
  );
}
  }

  // ─── Create payment (full flow) ────────────

  async createPayment(guestId: number, dto: CreatePaymentDto) {
    // 1. find booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        listing: true,
        guest: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. only the guest can pay
    if (booking.guestId !== guestId) {
      throw new ForbiddenException('You can only pay for your own bookings');
    }

    // 3. booking must be PENDING_PAYMENT
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Cannot pay for a booking with status: ${booking.status}`,
      );
    }

    if (
      booking.approvedAt &&
      Date.now() - booking.approvedAt.getTime() > 24 * 60 * 60 * 1000
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELED,
            cancellationReason:
              'تم إلغاء الحجز تلقائيا لأن الدفع لم يكتمل خلال 24 ساعة.',
            cancelledAt: new Date(),
          },
        });

        const activeReservation = await tx.booking.findFirst({
          where: {
            listingId: booking.listingId,
            id: { not: booking.id },
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

        if (!activeReservation) {
          await tx.listing.update({
            where: { id: booking.listingId },
            data: { status: 'ACTIVE' },
          });
        }
      });

      throw new BadRequestException(
        'انتهت مهلة الدفع وتم إلغاء الحجز. يمكنك إرسال طلب حجز جديد إذا أصبح العقار متاحا.',
      );
    }

    // 4. check no payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId: dto.bookingId },
    });

    const alreadyPaidStatuses: PaymentStatus[] = [
      PaymentStatus.HELD,
      PaymentStatus.RELEASED,
      PaymentStatus.REFUNDED,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];

    if (
      existingPayment &&
      alreadyPaidStatuses.includes(existingPayment.status)
    ) {
      throw new BadRequestException('This booking has already been paid');
    }

    // 5. calculate amounts

    if (
  booking.agreedAmount === null ||
  booking.agreedAmount === undefined ||
  booking.agreedAmount <= 0
) {
  throw new BadRequestException(
    'The booking does not have a valid agreed amount',
  );
}
    const amountCents = booking.agreedAmount! * 100;
    const platformFee = Math.round(
      (amountCents * this.platformFeePercent) / 100,
    );
    const hostPayout = amountCents - platformFee;

    // 6. run Paymob 3-step flow
    const authToken = await this.getAuthToken();

    const paymobOrderId = await this.createOrder(authToken, amountCents, {
      merchantOrderId: `booking_${dto.bookingId}_${Date.now()}`,
    });

    // const billingData = {
    //   first_name: booking.guest.firstName,
    //   last_name: booking.guest.lastName,
    //   email: booking.guest.email,
    //   phone_number: 'NA',
    //   street: booking.listing.streetName ?? 'NA',
    //   city: booking.listing.city ?? 'NA',
    //   country: 'EG',
    //   state: booking.listing.governorate ?? 'NA',
    // };


    const billingData = {
  apartment: booking.listing.apartmentNumber ?? 'NA',
  email: booking.guest.email,
  floor: booking.listing.floorNumber ?? 'NA',
  first_name: booking.guest.firstName || 'Guest',
  street: booking.listing.streetName || 'NA',
  building: booking.listing.buildingNumber ?? 'NA',

  // رقم تجريبي مؤقت أثناء development
  phone_number: '01000000000',

  shipping_method: 'NA',
  postal_code: 'NA',
  city: booking.listing.city || 'NA',
  country: 'EG',
  last_name: booking.guest.lastName || 'Guest',
  state: booking.listing.governorate || 'NA',
};

    const paymentToken = await this.getPaymentKey(
      authToken,
      paymobOrderId,
      amountCents,
      billingData,
    );

    // 7. save or update payment record
    await this.prisma.payment.upsert({
      where: { bookingId: dto.bookingId },
      create: {
        bookingId: dto.bookingId,
        paymobOrderId,
        amount: amountCents,
        platformFee,
        hostPayoutAmount: hostPayout,
        currency: 'EGP',
        status: PaymentStatus.PENDING,
      },
      update: {
  paymobOrderId,
  paymobTransactionId: null,

  amount: amountCents,
  platformFee,
  hostPayoutAmount: hostPayout,
  currency: 'EGP',

  status: PaymentStatus.PENDING,

  paymentMethod: null,
  paidAt: null,
  heldAt: null,
  releasedAt: null,
  refundedAt: null,
  refundReason: null,
},
    });

    // 8. return iframe URL for frontend
    return {
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`,
      amountCents,
      platformFee,
      hostPayout,
      bookingId: dto.bookingId,
    };
  }

  // ─── Paymob webhook handler ─────────────────

  async handleWebhook(body: any, hmac: string) {
    // 1. verify HMAC signature — CRITICAL security check
    const isValid = this.verifyHmac(body, hmac);

    if (!isValid) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const transaction = body.obj;
    const paymobOrderId = String(transaction.order?.id);
    const transactionId = String(transaction.id);
    const paymentMethod = transaction.source_data?.type ?? 'unknown';

    // 2. find payment record by Paymob order ID
    const payment = await this.prisma.payment.findUnique({
      where: { paymobOrderId },
    });

    if (!payment) {
      // not our order — ignore silently
      return { received: true };
    }

    if (
  payment.status === PaymentStatus.HELD ||
  payment.status === PaymentStatus.RELEASED ||
  payment.status === PaymentStatus.REFUNDED ||
  payment.status === PaymentStatus.PARTIALLY_REFUNDED
) {
  return {
    received: true,
    status: 'already_processed',
  };
}

const receivedAmount = Number(transaction.amount_cents);
const receivedCurrency = String(
  transaction.currency ?? '',
).toUpperCase();

if (
  !Number.isFinite(receivedAmount) ||
  receivedAmount !== payment.amount
) {
  throw new BadRequestException('Payment amount mismatch');
}

if (
  receivedCurrency !== payment.currency.toUpperCase()
) {
  throw new BadRequestException('Payment currency mismatch');
}

// لو Paymob بتقول إن العملية لسه Pending
// ما نحولهاش إلى FAILED أو HELD
if (transaction.pending === true) {
  return {
    received: true,
    status: 'pending',
  };
}

const paymentSucceeded = transaction.success === true;

    if (paymentSucceeded) {
      const payableBooking = await this.prisma.booking.findUnique({
        where: { id: payment.bookingId },
        select: { status: true },
      });

      if (payableBooking?.status !== BookingStatus.PENDING_PAYMENT) {
        return {
          received: true,
          status: 'booking_not_payable',
          bookingStatus: payableBooking?.status,
        };
      }

      // 3. payment succeeded — confirm booking
      await this.prisma.$transaction([
        // update payment record
        this.prisma.payment.update({
          where: { paymobOrderId },
          data: {
            status: PaymentStatus.HELD,
            heldAt: new Date(),
            paymobTransactionId: transactionId,
            paymentMethod,
            paidAt: new Date(),
          },
        }),
        // confirm the booking
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: BookingStatus.CHECK_IN_PENDING,
            confirmedAt: new Date(),
          },
        }),
      ]);

      return {
  received: true,
  status: 'held',
  paymentStatus: PaymentStatus.HELD,
  bookingStatus: BookingStatus.CHECK_IN_PENDING,
};
    } else {
      // 4. payment failed
      await this.prisma.payment.update({
        where: { paymobOrderId },
        data: {
          status: PaymentStatus.FAILED,
          paymobTransactionId: transactionId,
        },
      });

      return { received: true, status: 'failed' };
    }
  }

  // ─── Verify Paymob HMAC ─────────────────────

  private verifyHmac(body: any, receivedHmac: string): boolean {
    try {
      const obj = body.obj;

      // Paymob concatenates these exact fields in this exact order
      const hmacString = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order?.id,
        obj.owner,
        obj.pending,
        obj.source_data?.pan,
        obj.source_data?.sub_type,
        obj.source_data?.type,
        obj.success,
      ].join('');

      const computedHmac = crypto
        .createHmac('sha512', this.hmacSecret)
        .update(hmacString)
        .digest('hex');

      return computedHmac === receivedHmac;
    } catch {
      return false;
    }
  }

  // ─── Get payment by booking ─────────────────

  async getPaymentByBooking(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.hostId === userId;

    if (!isGuest && !isHost) {
      throw new ForbiddenException(
        'You do not have permission to view this payment',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment)
      throw new NotFoundException('No payment found for this booking');

    return payment;
  }

  // ─── Get my payments (guest) ────────────────

  async getMyPayments(guestId: number) {
    return this.prisma.payment.findMany({
      where: {
        booking: { guestId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
                photos: { where: { isCover: true }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  // ─── Get host earnings ──────────────────────

  async getHostEarnings(hostId: number) {
  const [heldPayments, releasedPayments] = await Promise.all([
    // فلوس مدفوعة لكنها معلقة
    this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.HELD,
        booking: {
          listing: {
            hostId,
          },
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
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
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    }),

    // فلوس أصبحت متاحة لصاحب السكن
    this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.RELEASED,
        booking: {
          listing: {
            hostId,
          },
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
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
        },
      },
      orderBy: {
        releasedAt: 'desc',
      },
    }),
  ]);

  const pendingBalanceCents = heldPayments.reduce(
    (sum, payment) =>
      sum + payment.hostPayoutAmount,
    0,
  );

  const availableBalanceCents =
    releasedPayments.reduce(
      (sum, payment) =>
        sum + payment.hostPayoutAmount,
      0,
    );

  return {
    pendingPayments: heldPayments,
    releasedPayments,

    summary: {
      pendingBalanceCents,
      availableBalanceCents,

      // القيم دي بالجنيه عشان الـ frontend يعرضها
      pendingBalance: pendingBalanceCents / 100,
      availableBalance: availableBalanceCents / 100,

      pendingTransactions: heldPayments.length,
      releasedTransactions: releasedPayments.length,

      currency: 'EGP',
    },
  };
}

  // ─── Admin: refund payment ──────────────────

  async refundPayment(paymentId: number, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.HELD) {
  throw new BadRequestException(
    'Only held payments can be refunded',
  );
}

if (!payment.paymobTransactionId) {
  throw new BadRequestException(
    'Payment transaction ID is missing',
  );
}

const refundAmount =
  dto.amountCents ?? payment.amount;

if (
  refundAmount <= 0 ||
  refundAmount > payment.amount
) {
  throw new BadRequestException(
    'Invalid refund amount',
  );
}


    // call Paymob refund API
    try {
      const authToken = await this.getAuthToken();

      await axios.post(`${this.baseUrl}/acceptance/void_refund/refund`, {
        auth_token: authToken,
        transaction_id: payment.paymobTransactionId,
        amount_cents: refundAmount,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to process refund with payment provider',
      );
    }

    // update payment record
    return this.prisma.$transaction(async (tx) => {
  const isFullRefund =
    refundAmount === payment.amount;

  const updatedPayment =
    await tx.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: isFullRefund
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,

        refundReason: dto.reason,
        refundedAt: new Date(),
      },
    });

  if (isFullRefund) {
    await tx.booking.update({
      where: {
        id: payment.bookingId,
      },
      data: {
        status: BookingStatus.REFUNDED,

        disputeResolvedAt: new Date(),
        disputeResolution:
          dto.reason ||
          'Full refund issued to guest',
      },
    });
  }

  return updatedPayment;
});
  }



  async releasePaymentByAdmin(
  paymentId: number,
  dto: ReleasePaymentDto,
) {
  const payment =
    await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        booking: true,
      },
    });

  if (!payment) {
    throw new NotFoundException(
      'Payment not found',
    );
  }

  if (payment.status !== PaymentStatus.HELD) {
    throw new BadRequestException(
      'Only held payments can be released',
    );
  }

  if (
    payment.booking.status !==
    BookingStatus.DISPUTED
  ) {
    throw new BadRequestException(
      'Admin release is only allowed for disputed bookings',
    );
  }

  return this.prisma.$transaction(
    async (tx) => {
      const updatedPayment =
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: PaymentStatus.RELEASED,
            releasedAt: new Date(),
          },
        });

      await tx.booking.update({
        where: {
          id: payment.bookingId,
        },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),

          disputeResolvedAt: new Date(),
          disputeResolution:
            dto.note ||
            'Dispute resolved in favor of the host',
        },
      });

      return updatedPayment;
    },
  );
}
}
