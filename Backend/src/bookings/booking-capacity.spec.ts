import {
  calculateCapacity,
  getPaymentExpiresAt,
  PAYMENT_DEADLINE_MS,
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
});
