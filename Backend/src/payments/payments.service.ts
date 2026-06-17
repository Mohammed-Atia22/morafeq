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

@Injectable()
export class PaymentsService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly integrationId: string;
  private readonly iframeId: string;
  private readonly hmacSecret: string;
  private readonly platformFeePercent = 5; // 5% platform fee

  constructor(
    private prisma:  PrismaService,
    private config:  ConfigService,
  ) {
    this.baseUrl      = this.config.get('PAYMOB_BASE_URL') ?? 'https://accept.paymob.com/api';
    this.apiKey       = this.config.getOrThrow('PAYMOB_API_KEY');
    this.integrationId = this.config.getOrThrow('PAYMOB_INTEGRATION_ID');
    this.iframeId     = this.config.getOrThrow('PAYMOB_IFRAME_ID');
    this.hmacSecret   = this.config.getOrThrow('PAYMOB_HMAC_SECRET');
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
        auth_token:      authToken,
        delivery_needed: false,
        amount_cents:    amountCents,
        currency:        'EGP',
        merchant_order_id: paymobOrderData.merchantOrderId,
        items:           [],
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
      const res = await axios.post(
        `${this.baseUrl}/acceptance/payment_keys`,
        {
          auth_token:     authToken,
          amount_cents:   amountCents,
          expiration:     3600, // 1 hour
          order_id:       orderId,
          currency:       'EGP',
          integration_id: this.integrationId,
          billing_data:   billingData,
        },
      );
      return res.data.token;
    } catch {
      throw new InternalServerErrorException(
        'Failed to get payment key from provider',
      );
    }
  }

  // ─── Create payment (full flow) ────────────

  async createPayment(guestId: number, dto: CreatePaymentDto) {
    // 1. find booking
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

    // 4. check no payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.CAPTURED) {
      throw new BadRequestException('This booking has already been paid');
    }

    // 5. calculate amounts
    const amountCents   = booking.listing.monthlyRent;
    const platformFee   = Math.round(amountCents * this.platformFeePercent / 100);
    const hostPayout    = amountCents - platformFee;

    // 6. run Paymob 3-step flow
    const authToken = await this.getAuthToken();

    const paymobOrderId = await this.createOrder(
      authToken,
      amountCents,
      { merchantOrderId: `booking_${dto.bookingId}` },
    );

    const billingData = {
      first_name:   booking.guest.firstName,
      last_name:    booking.guest.lastName,
      email:        booking.guest.email,
      phone_number: 'NA',
      street:       booking.listing.streetName ?? 'NA',
      city:         booking.listing.city       ?? 'NA',
      country:      'EG',
      state:        booking.listing.governorate ?? 'NA',
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
        bookingId:       dto.bookingId,
        paymobOrderId,
        amount:          amountCents,
        platformFee,
        hostPayoutAmount: hostPayout,
        currency:        'EGP',
        status:          PaymentStatus.PENDING,
      },
      update: {
        paymobOrderId,
        status: PaymentStatus.PENDING,
      },
    });

    // 8. return iframe URL for frontend
    return {
      iframeUrl:    `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`,
      amountCents,
      platformFee,
      hostPayout,
      bookingId:    dto.bookingId,
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
    const success     = transaction.success;
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

    if (success === true) {
      // 3. payment succeeded — confirm booking
      await this.prisma.$transaction([
        // update payment record
        this.prisma.payment.update({
          where: { paymobOrderId },
          data:  {
            status:             PaymentStatus.CAPTURED,
            paymobTransactionId: transactionId,
            paymentMethod,
            paidAt:             new Date(),
          },
        }),
        // confirm the booking
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data:  {
            status:      BookingStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        }),
      ]);

      return { received: true, status: 'confirmed' };
    } else {
      // 4. payment failed
      await this.prisma.payment.update({
        where: { paymobOrderId },
        data:  {
          status:             PaymentStatus.FAILED,
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
      where:   { id: bookingId },
      include: { listing: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isGuest = booking.guestId === userId;
    const isHost  = booking.listing.hostId === userId;

    if (!isGuest && !isHost) {
      throw new ForbiddenException(
        'You do not have permission to view this payment',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) throw new NotFoundException('No payment found for this booking');

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
            id:       true,
            status:   true,
            listing: {
              select: {
                id:    true,
                title: true,
                city:  true,
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
    const payments = await this.prisma.payment.findMany({
      where: {
        status:  PaymentStatus.CAPTURED,
        booking: {
          listing: { hostId },
        },
      },
      include: {
        booking: {
          select: {
            id:       true,
            status:   true,
            listing: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalEarnings = payments.reduce(
      (sum, p) => sum + p.hostPayoutAmount,
      0,
    );

    return {
      payments,
      summary: {
        totalEarnings,
        totalTransactions: payments.length,
        currency:          'EGP',
      },
    };
  }

  // ─── Admin: refund payment ──────────────────

  async refundPayment(
    paymentId: number,
    dto: RefundPaymentDto,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException(
        'Only captured payments can be refunded',
      );
    }

    const refundAmount = dto.amountCents ?? payment.amount;

    // call Paymob refund API
    try {
      const authToken = await this.getAuthToken();

      await axios.post(`${this.baseUrl}/acceptance/void_refund/refund`, {
        auth_token:      authToken,
        transaction_id:  payment.paymobTransactionId,
        amount_cents:    refundAmount,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to process refund with payment provider',
      );
    }

    // update payment record
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data:  {
        status:      refundAmount === payment.amount
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,
        refundReason: dto.reason,
        refundedAt:  new Date(),
      },
    });

    return updatedPayment;
  }
}