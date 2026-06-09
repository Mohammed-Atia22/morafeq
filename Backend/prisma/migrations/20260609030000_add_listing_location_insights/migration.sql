-- CreateTable
CREATE TABLE `listing_location_insights` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `provider` VARCHAR(50) NOT NULL DEFAULT 'overpass',
    `radiusMeters` INTEGER UNSIGNED NOT NULL DEFAULT 1000,
    `nearbyServices` JSON NULL,
    `advantages` JSON NULL,
    `disadvantages` JSON NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `listing_location_insights_listingId_key`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `listing_location_insights` ADD CONSTRAINT `listing_location_insights_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
