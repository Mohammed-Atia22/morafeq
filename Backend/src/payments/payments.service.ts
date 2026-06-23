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
import { BookingStatus, ListingStatus, PaymentStatus, Prisma } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';
import { ReleasePaymentDto } from './dto/release-payment.dto';
import {
  calculateCapacity,
  CAPACITY_HOLDING_BOOKING_STATUSES,
  getPaymentExpiresAt,
  areAllRoomsFull,
} from '../bookings/booking-capacity';

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

    const paymentExpiresAt =
      booking.paymentExpiresAt ??
      (booking.approvedAt ? getPaymentExpiresAt(booking.approvedAt) : null);

    if (paymentExpiresAt && paymentExpiresAt.getTime() <= Date.now()) {
      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.EXPIRED,
            cancellationReason: 'انتهت مهلة الدفع الخاصة بالحجز.',
            cancelledAt: new Date(),
          },
        });

        if (booking.roomId) {
          const room = await tx.room.findUnique({
            where: { id: booking.roomId },
            select: { occupiedCount: true },
          });

          if (room && room.occupiedCount > 0) {
            await tx.room.update({
              where: { id: booking.roomId },
              data: { occupiedCount: { decrement: 1 } },
            });
          }
        }

        await this.recalculateListingVisibility(tx, booking.listingId);
      });

      throw new BadRequestException(
        'انتهت مهلة الدفع الخاصة بالحجز. يمكنك إرسال طلب حجز جديد إذا كان هناك أماكن متاحة.',
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
   // قيمة الإيجار بالقروش
const rentAmountCents = booking.agreedAmount * 100;

// مبلغ التأمين بالقروش
const securityDepositAmountCents =
  (booking.listing.depositAmount ?? 0) * 100;

// رسوم المنصة يدفعها المغترب فوق الإيجار
const platformFee = Math.round(
  (rentAmountCents * this.platformFeePercent) / 100,
);

// إجمالي ما سيدفعه المغترب:
// الإيجار + التأمين + رسوم المنصة
const amountCents =
  rentAmountCents +
  securityDepositAmountCents +
  platformFee;

// في حالة الاستلام الطبيعي:
// صاحب السكن يستحق الإيجار + التأمين
const hostPayout =
  rentAmountCents + securityDepositAmountCents;

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
  where: {
    bookingId: dto.bookingId,
  },
  create: {
  bookingId: dto.bookingId,
  paymobOrderId,

  // تفاصيل المبلغ وقت الدفع
  rentAmount: rentAmountCents,
  securityDepositAmount: securityDepositAmountCents,

  // الإجمالي المدفوع من المغترب
  amount: amountCents,

  // رسوم المنصة المدفوعة من المغترب
  platformFee,

  // الإيجار + التأمين في حالة الاستلام الطبيعي
  hostPayoutAmount: hostPayout,

  // لسه مفيش نزاع اتحسم
  guestRefundAmount: 0,
  hostCompensationAmount: 0,

  currency: 'EGP',
  status: PaymentStatus.PENDING,
},
  update: {
  paymobOrderId,
  paymobTransactionId: null,

  rentAmount: rentAmountCents,
  securityDepositAmount: securityDepositAmountCents,

  amount: amountCents,
  platformFee,
  hostPayoutAmount: hostPayout,

  guestRefundAmount: 0,
  hostCompensationAmount: 0,

  currency: 'EGP',
  status: PaymentStatus.PENDING,

  paymentMethod: null,
  paidAt: null,
  heldAt: null,
  releasedAt: null,
  refundedAt: null,
  settledAt: null,
  refundReason: null,
},
});

    // 8. return iframe URL for frontend
    return {
  iframeUrl:
    `https://accept.paymob.com/api/acceptance/iframes/` +
    `${this.iframeId}?payment_token=${paymentToken}`,

  bookingId: dto.bookingId,

  amounts: {
  rentAmountCents,
  securityDepositAmountCents,
  serviceFeeCents: platformFee,
  totalAmountCents: amountCents,
  hostPayoutCents: hostPayout,

  rentAmount: rentAmountCents / 100,
  depositAmount: securityDepositAmountCents / 100,
  securityDepositAmount:
    securityDepositAmountCents / 100,
  platformFee: platformFee / 100,
  serviceFee: platformFee / 100,
  totalAmount: amountCents / 100,
  hostPayout: hostPayout / 100,

  currency: 'EGP',
},
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

    if (payment.paymobTransactionId === transactionId) {
      return {
        received: true,
        status: 'duplicate_ignored',
      };
    }

    if (transactionId) {
      const existingTransaction = await this.prisma.payment.findUnique({
        where: { paymobTransactionId: transactionId },
        select: { id: true },
      });

      if (existingTransaction) {
        return {
          received: true,
          status: 'duplicate_ignored',
        };
      }
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
        select: {
          status: true,
          approvedAt: true,
          paymentExpiresAt: true,
        },
      });

      const expiresAt =
        payableBooking?.paymentExpiresAt ??
        (payableBooking?.approvedAt
          ? getPaymentExpiresAt(payableBooking.approvedAt)
          : null);

      if (
        payableBooking?.status !== BookingStatus.PENDING_PAYMENT ||
        (expiresAt && expiresAt.getTime() <= Date.now())
      ) {
        return {
          received: true,
          status: 'booking_not_payable',
          bookingStatus: payableBooking?.status,
        };
      }

      // 3. payment succeeded — confirm booking
      try {
        const claimResult = await this.prisma.$transaction(async (tx) => {
          const paymentUpdate = await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: PaymentStatus.PENDING,
              paymobTransactionId: null,
            },
            data: {
              status: PaymentStatus.HELD,
              heldAt: new Date(),
              paymobTransactionId: transactionId,
              paymentMethod,
              paidAt: new Date(),
            },
          });

          if (paymentUpdate.count === 0) {
            return { claimed: false };
          }

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: {
              status: BookingStatus.CHECK_IN_PENDING,
              confirmedAt: new Date(),
            },
          });

          return { claimed: true };
        });

        if (!claimResult.claimed) {
          return {
            received: true,
            status: 'duplicate_ignored',
          };
        }
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return {
            received: true,
            status: 'duplicate_ignored',
          };
        }

        throw error;
      }

      return {
  received: true,
  status: 'held',
  paymentStatus: PaymentStatus.HELD,
  bookingStatus: BookingStatus.CHECK_IN_PENDING,
};
    } else {
      // 4. payment failed
      try {
        const paymentUpdate = await this.prisma.payment.updateMany({
          where: {
            id: payment.id,
            status: PaymentStatus.PENDING,
            paymobTransactionId: null,
          },
          data: {
            status: PaymentStatus.FAILED,
            paymobTransactionId: transactionId,
          },
        });

        if (paymentUpdate.count === 0) {
          return {
            received: true,
            status: 'duplicate_ignored',
          };
        }
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return {
            received: true,
            status: 'duplicate_ignored',
          };
        }

        throw error;
      }

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
  const [
    heldPayments,
    releasedPayments,
    compensationPayments,
  ] = await Promise.all([
    // 1. مبالغ مدفوعة لكنها ما زالت معلقة
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

    // 2. حجوزات اكتملت طبيعيًا وأصبح المبلغ متاحًا
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

    // 3. مبلغ التأمين الذي حصل عليه صاحب السكن
    // بعد حل النزاع لصالحه وإلغاء المغترب للحجز
    this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PARTIALLY_REFUNDED,

        hostCompensationAmount: {
          gt: 0,
        },

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
        settledAt: 'desc',
      },
    }),
  ]);

  // المبالغ المعلقة قبل تأكيد الاستلام أو حسم النزاع
  const pendingBalanceCents = heldPayments.reduce(
    (sum, payment) =>
      sum + payment.hostPayoutAmount,
    0,
  );

  // المبالغ الناتجة عن حجوزات مكتملة طبيعيًا
  const releasedBalanceCents = releasedPayments.reduce(
    (sum, payment) =>
      sum + payment.hostPayoutAmount,
    0,
  );

  // مبالغ التأمين الناتجة عن النزاعات
  const compensationBalanceCents =
    compensationPayments.reduce(
      (sum, payment) =>
        sum + payment.hostCompensationAmount,
      0,
    );

  // إجمالي ما يستطيع صاحب السكن التصرف فيه
  const availableBalanceCents =
    releasedBalanceCents +
    compensationBalanceCents;

  return {
    pendingPayments: heldPayments,
    releasedPayments,
    compensationPayments,

    summary: {
      pendingBalanceCents,
      releasedBalanceCents,
      compensationBalanceCents,
      availableBalanceCents,

      pendingBalance:
        pendingBalanceCents / 100,

      releasedBalance:
        releasedBalanceCents / 100,

      compensationBalance:
        compensationBalanceCents / 100,

      availableBalance:
        availableBalanceCents / 100,

      pendingTransactions:
        heldPayments.length,

      releasedTransactions:
        releasedPayments.length,

      compensationTransactions:
        compensationPayments.length,

      currency: 'EGP',
    },
  };
}

  // ─── Admin: refund payment ──────────────────

  async refundPayment(paymentId: number, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) throw new NotFoundException('لم يتم العثور على الدفعة');

    if (payment.status !== PaymentStatus.HELD) {
  throw new BadRequestException(
    'يمكن استرداد الدفعات المعلقة فقط',
  );
}

if (!payment.paymobTransactionId) {
  throw new BadRequestException(
    'رقم معاملة الدفع غير موجود',
  );
}

const refundAmount =
  dto.amountCents ?? payment.amount;

if (
  refundAmount <= 0 ||
  refundAmount > payment.amount
) {
  throw new BadRequestException(
    'قيمة الاسترداد غير صحيحة',
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
        'تعذر تنفيذ الاسترداد من مزود الدفع',
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
    if (payment.booking.roomId) {
      const room = await tx.room.findUnique({
        where: { id: payment.booking.roomId },
        select: { occupiedCount: true },
      });

      if (room && room.occupiedCount > 0) {
        await tx.room.update({
          where: { id: payment.booking.roomId },
          data: { occupiedCount: { decrement: 1 } },
        });
      }
    }

    await tx.booking.update({
      where: {
        id: payment.bookingId,
      },
      data: {
        status: BookingStatus.REFUNDED,

        disputeResolvedAt: new Date(),
        disputeResolution:
          dto.reason ||
          'تم إصدار استرداد كامل للمستأجر.',
      },
    });

    await this.recalculateListingVisibility(
      tx,
      payment.booking.listingId,
    );
  }

  return updatedPayment;
});
  }

  private async recalculateListingVisibility(
    tx: any,
    listingId: number,
  ) {
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

    if (!listing) return;

    const activeReservedPlaces = await tx.booking.count({
      where: {
        listingId,
        status: { in: CAPACITY_HOLDING_BOOKING_STATUSES },
      },
    });
    const capacityState = calculateCapacity(
      listing.maxTenants,
      activeReservedPlaces,
    );
    const shouldBeHidden = capacityState.isFull || areAllRoomsFull(listing);

    if (shouldBeHidden && listing.status === ListingStatus.ACTIVE) {
      await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.RESERVED },
      });
    }

    if (!shouldBeHidden && listing.status === ListingStatus.RESERVED) {
      await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.ACTIVE },
      });
    }
  }



  async resolveDisputeForHost(
  paymentId: number,
  dto: ReleasePaymentDto,
) {
  const payment = await this.prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      booking: true,
    },
  });

  if (!payment) {
    throw new NotFoundException('لم يتم العثور على الدفعة');
  }

  if (payment.status !== PaymentStatus.HELD) {
    throw new BadRequestException(
      'يمكن تسوية الدفعات المعلقة فقط',
    );
  }

  if (payment.booking.status !== BookingStatus.DISPUTED) {
    throw new BadRequestException(
      'لا يوجد نزاع نشط لهذا الحجز',
    );
  }

  const hostCompensationAmount = payment.securityDepositAmount;
  const guestRefundAmount = payment.rentAmount;

  if (hostCompensationAmount < 0 || guestRefundAmount <= 0) {
    throw new BadRequestException(
      'قيم تسوية النزاع غير صحيحة',
    );
  }

  const updatedBooking = await this.prisma.booking.update({
    where: {
      id: payment.bookingId,
    },
    data: {
      status: BookingStatus.DISPUTE_RESOLVED_FOR_HOST,
      disputeResolvedAt: new Date(),
      disputeResolution:
        dto.note ||
        'تم حل النزاع لصالح المالك. يرجى اختيار متابعة الحجز أو الإلغاء.',
    },
  });

  return {
    message: 'تم حل النزاع لصالح المالك وبانتظار قرار المستأجر',

    settlement: {
      totalPaidCents: payment.amount,
      guestRefundCents: guestRefundAmount,
      hostCompensationCents: hostCompensationAmount,
      platformFeeCents: payment.platformFee,
      rentAmountCents: payment.rentAmount,
      securityDepositAmountCents: payment.securityDepositAmount,

      totalPaid: payment.amount / 100,
      guestRefund: guestRefundAmount / 100,
      hostCompensation: hostCompensationAmount / 100,
      platformFee: payment.platformFee / 100,
      rentAmount: payment.rentAmount / 100,
      depositAmount: payment.securityDepositAmount / 100,

      currency: payment.currency,
    },

    payment,
    booking: updatedBooking,
  };
}

async finalizeDisputeCancellationForGuest(
  bookingId: number,
  guestId: number,
) {
  const booking = await this.prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      listing: true,
    },
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

  const payment = booking.payment;

  if (!payment || payment.status !== PaymentStatus.HELD) {
    throw new BadRequestException(
      'لا توجد دفعة معلقة مرتبطة بهذا الحجز',
    );
  }

  const hostCompensationAmount = payment.securityDepositAmount;
  const guestRefundAmount = payment.rentAmount;

  if (!payment.paymobTransactionId) {
    throw new BadRequestException(
      'رقم معاملة الدفع غير موجود',
    );
  }

  try {
    const authToken = await this.getAuthToken();

    await axios.post(
      `${this.baseUrl}/acceptance/void_refund/refund`,
      {
        auth_token: authToken,
        transaction_id: payment.paymobTransactionId,
        amount_cents: guestRefundAmount,
      },
    );
  } catch (error: any) {
    console.error('Paymob partial refund error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new InternalServerErrorException(
      'تعذر تنفيذ الاسترداد الجزئي للمستأجر',
    );
  }

  return this.prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PARTIALLY_REFUNDED,
        guestRefundAmount,
        hostCompensationAmount,
        refundReason:
          'تم إلغاء الحجز باختيار المستأجر بعد حل النزاع لصالح المالك.',
        refundedAt: new Date(),
        settledAt: new Date(),
      },
    });

    const updatedBooking = await tx.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: BookingStatus.CANCELLED_AFTER_DISPUTE,
        cancellationReason:
          'تم إلغاء الحجز باختيار المستأجر بعد حل النزاع لصالح المالك.',
        cancelledAt: new Date(),
      },
    });

    if (booking.roomId) {
      const room = await tx.room.findUnique({
        where: { id: booking.roomId },
        select: { occupiedCount: true },
      });

      if (room && room.occupiedCount > 0) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { occupiedCount: { decrement: 1 } },
        });
      }
    }

    await this.recalculateListingVisibility(tx, booking.listingId);

    return {
      message: 'تم إلغاء الحجز واسترداد المبلغ المستحق',
      settlement: {
        totalPaid: payment.amount / 100,
        guestRefund: guestRefundAmount / 100,
        hostCompensation: hostCompensationAmount / 100,
        platformFee: payment.platformFee / 100,
        rentAmount: payment.rentAmount / 100,
        depositAmount: payment.securityDepositAmount / 100,
        currency: payment.currency,
      },
      payment: updatedPayment,
      booking: updatedBooking,
    };
  });
}
}
