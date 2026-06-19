import { BookingStatus } from '@prisma/client';

export const PAYMENT_DEADLINE_MS = 60 * 60 * 1000;

export const CAPACITY_HOLDING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.CHECK_IN_PENDING,
  BookingStatus.DISPUTED,
  BookingStatus.COMPLETED,
];

export function getPaymentExpiresAt(approvedAt: Date) {
  return new Date(approvedAt.getTime() + PAYMENT_DEADLINE_MS);
}

export function calculateCapacity(maxTenants: number, activeReservedPlaces: number) {
  const reservedPlaces = Math.max(0, activeReservedPlaces);
  const availablePlaces = Math.max(0, maxTenants - reservedPlaces);

  return {
    maxTenants,
    reservedPlaces,
    activeReservedPlaces: reservedPlaces,
    availablePlaces,
    isFull: availablePlaces <= 0,
  };
}
