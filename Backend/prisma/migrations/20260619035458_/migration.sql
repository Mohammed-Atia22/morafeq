/*
  Warnings:

  - The values [CAPTURED] on the enum `payments_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropForeignKey
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_reviewedId_fkey`;

-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `agreedAmount` INTEGER UNSIGNED NULL,
    ADD COLUMN `disputeDescription` TEXT NULL,
    ADD COLUMN `disputeReason` VARCHAR(100) NULL,
    ADD COLUMN `disputeResolution` TEXT NULL,
    ADD COLUMN `disputeResolvedAt` DATETIME(3) NULL,
    ADD COLUMN `disputedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING_HOST_APPROVAL', 'PENDING_PAYMENT', 'CHECK_IN_PENDING', 'DISPUTED', 'COMPLETED', 'REJECTED', 'CANCELED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST', 'CANCELLED_AFTER_DISPUTE', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_HOST_APPROVAL';

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `guestRefundAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `heldAt` DATETIME(3) NULL,
    ADD COLUMN `hostCompensationAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `releasedAt` DATETIME(3) NULL,
    ADD COLUMN `rentAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `securityDepositAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `settledAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'HELD', 'RELEASED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `reviews` MODIFY `reviewedId` INTEGER UNSIGNED NULL,
    MODIFY `type` ENUM('GUEST_TO_LISTING', 'GUEST_TO_HOST', 'HOST_TO_GUEST') NOT NULL;

-- CreateIndex
CREATE INDEX `reviews_type_idx` ON `reviews`(`type`);

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewedId_fkey` FOREIGN KEY (`reviewedId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
