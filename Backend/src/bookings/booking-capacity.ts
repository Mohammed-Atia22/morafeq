import { BookingStatus, RoomType } from '@prisma/client';

export const PAYMENT_DEADLINE_MS = 60 * 60 * 1000;

type ListingCapacitySource = {
  roomType?: RoomType | string;
  rooms?: { capacity?: number; occupiedCount?: number }[];
};

export function isRoomBasedListing(listing: ListingCapacitySource) {
  return (
    listing.roomType !== RoomType.ENTIRE_PLACE &&
    (listing.rooms?.length ?? 0) > 0
  );
}

export function resolveReservedPlaces(
  listing: ListingCapacitySource,
  bookingReservedCount: number,
) {
  if (isRoomBasedListing(listing)) {
    return listing.rooms!.reduce(
      (sum, room) => sum + Number(room.occupiedCount ?? 0),
      0,
    );
  }

  return bookingReservedCount;
}

export function areAllRoomsFull(listing: ListingCapacitySource) {
  if (!isRoomBasedListing(listing)) {
    return false;
  }

  return listing.rooms!.every(
    (room) => Number(room.capacity) - Number(room.occupiedCount ?? 0) <= 0,
  );
}

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
