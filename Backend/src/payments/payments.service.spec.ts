import { BookingStatus, PaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  const webhookBody = {
    obj: {
      id: 98765,
      order: { id: 12345 },
      source_data: { type: 'card' },
      amount_cents: 105000,
      currency: 'EGP',
      pending: false,
      success: true,
    },
  };

  beforeEach(() => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) =>
        callback({
          payment: {
            updateMany: prisma.payment.updateMany,
          },
          booking: {
            update: prisma.booking.update,
          },
        }),
      ),
    };

    const config = {
      get: jest.fn(),
      getOrThrow: jest.fn((key: string) => `${key}_value`),
    } as unknown as ConfigService;

    service = new PaymentsService(prisma as PrismaService, config);
    jest.spyOn(service as any, 'verifyHmac').mockReturnValue(true);
  });

  it('ignores a retried Paymob webhook with the same transaction id', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 1,
      bookingId: 10,
      paymobOrderId: '12345',
      paymobTransactionId: '98765',
      amount: 105000,
      currency: 'EGP',
      status: PaymentStatus.HELD,
    });

    await expect(service.handleWebhook(webhookBody, 'valid')).resolves.toEqual({
      received: true,
      status: 'duplicate_ignored',
    });

    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('does not confirm the booking when another webhook already claimed the payment', async () => {
    prisma.payment.findUnique.mockImplementation(({ where }: any) => {
      if (where.paymobOrderId) {
        return Promise.resolve({
          id: 1,
          bookingId: 10,
          paymobOrderId: '12345',
          paymobTransactionId: null,
          amount: 105000,
          currency: 'EGP',
          status: PaymentStatus.PENDING,
        });
      }

      return Promise.resolve(null);
    });
    prisma.booking.findUnique.mockResolvedValue({
      status: BookingStatus.PENDING_PAYMENT,
      approvedAt: new Date(),
      paymentExpiresAt: new Date(Date.now() + 60_000),
    });
    prisma.payment.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.handleWebhook(webhookBody, 'valid')).resolves.toEqual({
      received: true,
      status: 'duplicate_ignored',
    });

    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 1,
          status: PaymentStatus.PENDING,
          paymobTransactionId: null,
        }),
      }),
    );
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});
