-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('GUEST', 'HOST', 'ADMIN') NOT NULL DEFAULT 'GUEST',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `iconUrl` VARCHAR(500) NULL,
    `slug` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `hostId` INTEGER UNSIGNED NOT NULL,
    `categoryId` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `propertyType` ENUM('APARTMENT', 'HOUSE', 'VILLA', 'CABIN', 'STUDIO', 'OTHER') NOT NULL,
    `roomType` ENUM('ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM') NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NOT NULL,
    `zipCode` VARCHAR(20) NULL,
    `lat` DECIMAL(10, 8) NOT NULL,
    `lng` DECIMAL(11, 8) NOT NULL,
    `pricePerNight` INTEGER UNSIGNED NOT NULL,
    `cleaningFee` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `maxGuests` INTEGER UNSIGNED NOT NULL,
    `bedrooms` INTEGER UNSIGNED NOT NULL,
    `beds` INTEGER UNSIGNED NOT NULL,
    `bathrooms` DECIMAL(3, 1) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `listings_hostId_idx`(`hostId`),
    INDEX `listings_city_idx`(`city`),
    INDEX `listings_country_idx`(`country`),
    INDEX `listings_status_idx`(`status`),
    INDEX `listings_pricePerNight_idx`(`pricePerNight`),
    INDEX `listings_lat_lng_idx`(`lat`, `lng`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_photos` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `sortOrder` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `isCover` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `listing_photos_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_amenities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `amenityKey` VARCHAR(50) NOT NULL,

    INDEX `listing_amenities_listingId_idx`(`listingId`),
    UNIQUE INDEX `listing_amenities_listingId_amenityKey_key`(`listingId`, `amenityKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `guestId` INTEGER UNSIGNED NOT NULL,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `checkIn` DATE NOT NULL,
    `checkOut` DATE NOT NULL,
    `guestsCount` INTEGER UNSIGNED NOT NULL,
    `nights` INTEGER UNSIGNED NOT NULL,
    `pricePerNight` INTEGER UNSIGNED NOT NULL,
    `cleaningFee` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `serviceFee` INTEGER UNSIGNED NOT NULL,
    `totalPrice` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED_GUEST', 'CANCELLED_HOST', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookings_guestId_idx`(`guestId`),
    INDEX `bookings_listingId_idx`(`listingId`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_checkIn_checkOut_idx`(`checkIn`, `checkOut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER UNSIGNED NOT NULL,
    `stripePaymentIntentId` VARCHAR(255) NULL,
    `stripeChargeId` VARCHAR(255) NULL,
    `stripeRefundId` VARCHAR(255) NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `hostPayoutAmount` INTEGER UNSIGNED NULL,
    `platformFee` INTEGER UNSIGNED NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'usd',
    `status` ENUM('PENDING', 'CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `refundReason` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_bookingId_key`(`bookingId`),
    UNIQUE INDEX `payments_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    INDEX `payments_bookingId_idx`(`bookingId`),
    INDEX `payments_stripePaymentIntentId_idx`(`stripePaymentIntentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER UNSIGNED NOT NULL,
    `reviewerId` INTEGER UNSIGNED NOT NULL,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `rating` INTEGER UNSIGNED NOT NULL,
    `cleanliness` INTEGER UNSIGNED NULL,
    `communication` INTEGER UNSIGNED NULL,
    `location` INTEGER UNSIGNED NULL,
    `value` INTEGER UNSIGNED NULL,
    `comment` TEXT NULL,
    `type` ENUM('GUEST_TO_HOST', 'HOST_TO_GUEST') NOT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reviews_listingId_idx`(`listingId`),
    INDEX `reviews_reviewerId_idx`(`reviewerId`),
    UNIQUE INDEX `reviews_bookingId_reviewerId_type_key`(`bookingId`, `reviewerId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER UNSIGNED NOT NULL,
    `senderId` INTEGER UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_bookingId_idx`(`bookingId`),
    INDEX `messages_senderId_idx`(`senderId`),
    INDEX `messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_photos` ADD CONSTRAINT `listing_photos_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_amenities` ADD CONSTRAINT `listing_amenities_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `availability_blocks` ADD CONSTRAINT `availability_blocks_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_guestId_fkey` FOREIGN KEY (`guestId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
