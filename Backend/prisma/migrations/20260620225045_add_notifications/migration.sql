-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED', 'USER_VERIFICATION_NEEDS_CHANGES', 'LISTING_VERIFICATION_APPROVED', 'LISTING_VERIFICATION_REJECTED', 'LISTING_VERIFICATION_NEEDS_CHANGES', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'PAYMENT_REQUIRED', 'PAYMENT_CONFIRMED') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `emailStatus` ENUM('NOT_REQUESTED', 'PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'NOT_REQUESTED',
    `emailSentAt` DATETIME(3) NULL,
    `emailError` TEXT NULL,
    `relatedEntity` VARCHAR(50) NULL,
    `relatedEntityId` INTEGER UNSIGNED NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
