import {
  calculateCapacity,
  getPaymentExpiresAt,
  isRoomBasedListing,
  PAYMENT_DEADLINE_MS,
  resolveReservedPlaces,
} from './booking-capacity';

describe('booking capacity helpers', () => {
  it('decreases available places when a place is reserved', () => {
    expect(calculateCapacity(3, 1)).toEqual({
      maxTenants: 3,
      reservedPlaces: 1,
      activeReservedPlaces: 1,
      availablePlaces: 2,
      isFull: false,
    });
  });

  it('marks the apartment full when no places remain', () => {
    expect(calculateCapacity(2, 2)).toEqual({
      maxTenants: 2,
      reservedPlaces: 2,
      activeReservedPlaces: 2,
      availablePlaces: 0,
      isFull: true,
    });
  });

  it('restores available places when a reservation is released', () => {
    expect(calculateCapacity(2, 1).availablePlaces).toBe(1);
  });

  it('sets payment expiration to one hour after approval', () => {
    const approvedAt = new Date('2026-06-19T10:00:00.000Z');

    expect(getPaymentExpiresAt(approvedAt).getTime()).toBe(
      approvedAt.getTime() + PAYMENT_DEADLINE_MS,
    );
  });

  it('detects restored apartment visibility when capacity returns', () => {
    const full = calculateCapacity(2, 2);
    const restored = calculateCapacity(2, 1);

    expect(full.isFull).toBe(true);
    expect(restored.isFull).toBe(false);
    expect(restored.availablePlaces).toBe(1);
  });

  it('keeps available places at zero when reservations exceed capacity', () => {
    expect(calculateCapacity(1, 3)).toMatchObject({
      availablePlaces: 0,
      isFull: true,
    });
  });

  it('uses booking count for entire-place listings even when rooms exist', () => {
    const listing = {
      roomType: 'ENTIRE_PLACE',
      rooms: [{ occupiedCount: 0 }, { occupiedCount: 0 }],
    };

    expect(isRoomBasedListing(listing)).toBe(false);
    expect(resolveReservedPlaces(listing, 2)).toBe(2);
  });

  it('uses room occupancy for shared or private room listings', () => {
    const listing = {
      roomType: 'PRIVATE_ROOM',
      rooms: [{ occupiedCount: 1 }, { occupiedCount: 2 }],
    };

    expect(isRoomBasedListing(listing)).toBe(true);
    expect(resolveReservedPlaces(listing, 5)).toBe(3);
  });
});
