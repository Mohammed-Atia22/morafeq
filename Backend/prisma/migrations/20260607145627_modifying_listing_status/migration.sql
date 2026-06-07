-- AlterTable
ALTER TABLE `listings` ADD COLUMN `furnished` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `internetIncluded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maximumStayMonths` INTEGER UNSIGNED NULL,
    ADD COLUMN `minimumStayMonths` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN `utilitiesIncluded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `viewsCount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('ACTIVE', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `availability_blocks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `blockedDate` DATE NOT NULL,
    `reason` ENUM('BOOKED', 'HOST_BLOCKED', 'MAINTENANCE') NOT NULL DEFAULT 'HOST_BLOCKED',

    INDEX `availability_blocks_listingId_blockedDate_idx`(`listingId`, `blockedDate`),
    UNIQUE INDEX `availability_blocks_listingId_blockedDate_key`(`listingId`, `blockedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `availability_blocks` ADD CONSTRAINT `availability_blocks_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `listings` RENAME INDEX `listings_categoryId_fkey` TO `listings_categoryId_idx`;
