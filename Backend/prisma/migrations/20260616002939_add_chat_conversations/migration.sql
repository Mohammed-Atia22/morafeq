/*
  Warnings:

  - You are about to drop the column `bookingId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `conversationId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_senderId_fkey`;

-- DropIndex
DROP INDEX `messages_createdAt_idx` ON `messages`;

-- AlterTable
ALTER TABLE `messages` DROP COLUMN `bookingId`,
    ADD COLUMN `conversationId` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `readAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `guestId` INTEGER UNSIGNED NOT NULL,
    `hostId` INTEGER UNSIGNED NOT NULL,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `conversations_guestId_idx`(`guestId`),
    INDEX `conversations_hostId_idx`(`hostId`),
    INDEX `conversations_listingId_idx`(`listingId`),
    UNIQUE INDEX `conversations_guestId_hostId_listingId_key`(`guestId`, `hostId`, `listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `messages_conversationId_idx` ON `messages`(`conversationId`);

-- CreateIndex
CREATE INDEX `messages_conversationId_createdAt_idx` ON `messages`(`conversationId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_guestId_fkey` FOREIGN KEY (`guestId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
