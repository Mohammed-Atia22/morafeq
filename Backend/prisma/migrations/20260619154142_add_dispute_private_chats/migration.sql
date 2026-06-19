-- AlterTable
ALTER TABLE `bookings` MODIFY `status` ENUM('PENDING_HOST_APPROVAL', 'PENDING_PAYMENT', 'CHECK_IN_PENDING', 'DISPUTED', 'DISPUTE_RESOLVED_FOR_HOST', 'COMPLETED', 'REJECTED', 'CANCELED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST', 'CANCELLED_AFTER_DISPUTE', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_HOST_APPROVAL';

-- CreateTable
CREATE TABLE `dispute_conversations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER UNSIGNED NOT NULL,
    `participantId` INTEGER UNSIGNED NOT NULL,
    `participantType` ENUM('GUEST', 'HOST') NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dispute_conversations_bookingId_idx`(`bookingId`),
    INDEX `dispute_conversations_participantId_idx`(`participantId`),
    UNIQUE INDEX `dispute_conversations_bookingId_participantType_key`(`bookingId`, `participantType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dispute_messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER UNSIGNED NOT NULL,
    `senderId` INTEGER UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dispute_messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `dispute_messages_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dispute_conversations` ADD CONSTRAINT `dispute_conversations_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispute_conversations` ADD CONSTRAINT `dispute_conversations_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispute_messages` ADD CONSTRAINT `dispute_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `dispute_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispute_messages` ADD CONSTRAINT `dispute_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
