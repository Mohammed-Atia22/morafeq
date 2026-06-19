-- Add one-hour payment expiry support while preserving existing booking statuses.
ALTER TABLE `bookings`
  ADD COLUMN `paymentExpiresAt` DATETIME(3) NULL;

ALTER TABLE `bookings`
  MODIFY `status` ENUM(
    'PENDING_HOST_APPROVAL',
    'PENDING_PAYMENT',
    'CHECK_IN_PENDING',
    'DISPUTED',
    'COMPLETED',
    'REJECTED',
    'EXPIRED',
    'CANCELED',
    'CANCELLED_BY_GUEST',
    'CANCELLED_BY_HOST',
    'CANCELLED_AFTER_DISPUTE',
    'REFUNDED'
  ) NOT NULL DEFAULT 'PENDING_HOST_APPROVAL';
