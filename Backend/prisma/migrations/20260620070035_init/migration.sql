-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `phone` TEXT NULL,
    `phoneCountry` VARCHAR(2) NULL,
    `phoneCountryCode` VARCHAR(5) NULL,
    `phoneHash` VARCHAR(64) NULL,
    `role` ENUM('GUEST', 'HOST', 'ADMIN') NOT NULL DEFAULT 'GUEST',
    `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false,
    `gender` ENUM('male', 'female') NOT NULL DEFAULT 'male',
    `bio` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verificationStatus` ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NOT_STARTED',
    `trustScore` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phoneHash_key`(`phoneHash`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_phoneCountry_idx`(`phoneCountry`),
    INDEX `users_phoneCountryCode_idx`(`phoneCountryCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `idFrontUrl` VARCHAR(500) NOT NULL,
    `idBackUrl` VARCHAR(500) NOT NULL,
    `selfieUrl` VARCHAR(500) NOT NULL,
    `status` ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verifications_userId_key`(`userId`),
    INDEX `verifications_status_idx`(`status`),
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
CREATE TABLE `otps` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `otp` VARCHAR(100) NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `otpTypes` ENUM('EMAIL_CONFIRMATION', 'RESET_PASSWORD') NOT NULL,

    INDEX `otps_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `hostId` INTEGER UNSIGNED NOT NULL,
    `areaId` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `propertyType` ENUM('APARTMENT', 'HOUSE', 'VILLA', 'CABIN', 'STUDIO', 'OTHER') NOT NULL,
    `roomType` ENUM('ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM') NOT NULL,
    `streetName` VARCHAR(255) NOT NULL,
    `buildingNumber` VARCHAR(50) NULL,
    `floorNumber` VARCHAR(50) NULL,
    `apartmentNumber` VARCHAR(50) NULL,
    `nearbyLandmark` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `governorate` VARCHAR(100) NOT NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Egypt',
    `lat` DECIMAL(10, 8) NOT NULL,
    `lng` DECIMAL(11, 8) NOT NULL,
    `googleFormattedAddress` VARCHAR(500) NULL,
    `googlePlaceId` VARCHAR(255) NULL,
    `locationPrivacy` ENUM('EXACT', 'APPROXIMATE') NOT NULL DEFAULT 'APPROXIMATE',
    `monthlyRent` INTEGER UNSIGNED NOT NULL,
    `depositAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `currency` ENUM('EGP') NOT NULL DEFAULT 'EGP',
    `maxTenants` INTEGER UNSIGNED NOT NULL,
    `bedrooms` INTEGER UNSIGNED NOT NULL,
    `beds` INTEGER UNSIGNED NOT NULL,
    `bathrooms` INTEGER UNSIGNED NOT NULL,
    `furnished` BOOLEAN NOT NULL DEFAULT true,
    `utilitiesIncluded` BOOLEAN NOT NULL DEFAULT false,
    `internetIncluded` BOOLEAN NOT NULL DEFAULT false,
    `minimumStayMonths` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `maximumStayMonths` INTEGER UNSIGNED NULL,
    `availableFrom` DATE NOT NULL,
    `genderPreference` ENUM('MALE', 'FEMALE', 'ANY') NOT NULL DEFAULT 'ANY',
    `smokingPolicy` ENUM('ALLOWED', 'NOT_ALLOWED') NOT NULL DEFAULT 'NOT_ALLOWED',
    `status` ENUM('ACTIVE', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RESERVED', 'REJECTED', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT',
    `rejectionReason` TEXT NULL,
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `viewsCount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `categoryId` INTEGER UNSIGNED NULL,

    INDEX `listings_hostId_idx`(`hostId`),
    INDEX `listings_areaId_idx`(`areaId`),
    INDEX `listings_categoryId_idx`(`categoryId`),
    INDEX `listings_city_idx`(`city`),
    INDEX `listings_governorate_idx`(`governorate`),
    INDEX `listings_status_idx`(`status`),
    INDEX `listings_monthlyRent_idx`(`monthlyRent`),
    INDEX `listings_lat_lng_idx`(`lat`, `lng`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `areas` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `governorate` VARCHAR(100) NOT NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Egypt',
    `googlePlaceId` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `areas_googlePlaceId_key`(`googlePlaceId`),
    INDEX `areas_city_idx`(`city`),
    INDEX `areas_governorate_idx`(`governorate`),
    UNIQUE INDEX `areas_name_city_governorate_country_key`(`name`, `city`, `governorate`, `country`),
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
    `deleteUrl` VARCHAR(500) NULL,

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
CREATE TABLE `bookings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `guestId` INTEGER UNSIGNED NOT NULL,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `preferredMoveInDate` DATE NULL,
    `guestMessage` TEXT NULL,
    `agreedAmount` INTEGER UNSIGNED NULL,
    `roomId` INTEGER UNSIGNED NULL,
    `selectedRoomName` VARCHAR(100) NULL,
    `status` ENUM('PENDING_HOST_APPROVAL', 'PENDING_PAYMENT', 'CHECK_IN_PENDING', 'DISPUTED', 'DISPUTE_RESOLVED_FOR_HOST', 'COMPLETED', 'REJECTED', 'CANCELED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST', 'CANCELLED_AFTER_DISPUTE', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_HOST_APPROVAL',
    `hostResponseNote` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `cancellationReason` TEXT NULL,
    `disputeReason` VARCHAR(100) NULL,
    `disputeDescription` TEXT NULL,
    `disputeResolution` TEXT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `paymentExpiresAt` DATETIME(3) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `disputedAt` DATETIME(3) NULL,
    `disputeResolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookings_guestId_idx`(`guestId`),
    INDEX `bookings_listingId_idx`(`listingId`),
    INDEX `bookings_roomId_idx`(`roomId`),
    INDEX `bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `apartmentId` INTEGER UNSIGNED NOT NULL,
    `roomNumber` INTEGER UNSIGNED NOT NULL,
    `roomName` VARCHAR(100) NOT NULL,
    `capacity` INTEGER UNSIGNED NOT NULL,
    `occupiedCount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rooms_apartmentId_idx`(`apartmentId`),
    UNIQUE INDEX `rooms_apartmentId_roomNumber_key`(`apartmentId`, `roomNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_images` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER UNSIGNED NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_images_roomId_idx`(`roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER UNSIGNED NOT NULL,
    `paymobOrderId` VARCHAR(255) NULL,
    `paymobTransactionId` VARCHAR(255) NULL,
    `rentAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `securityDepositAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `amount` INTEGER UNSIGNED NOT NULL,
    `platformFee` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `hostPayoutAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `guestRefundAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `hostCompensationAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'EGP',
    `status` ENUM('PENDING', 'HELD', 'RELEASED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` VARCHAR(50) NULL,
    `refundReason` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `heldAt` DATETIME(3) NULL,
    `releasedAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `settledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_bookingId_key`(`bookingId`),
    UNIQUE INDEX `payments_paymobOrderId_key`(`paymobOrderId`),
    UNIQUE INDEX `payments_paymobTransactionId_key`(`paymobTransactionId`),
    INDEX `payments_bookingId_idx`(`bookingId`),
    INDEX `payments_paymobOrderId_idx`(`paymobOrderId`),
    INDEX `payments_paymobTransactionId_idx`(`paymobTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER UNSIGNED NOT NULL,
    `reviewerId` INTEGER UNSIGNED NOT NULL,
    `listingId` INTEGER UNSIGNED NULL,
    `reviewedId` INTEGER UNSIGNED NULL,
    `type` ENUM('GUEST_TO_LISTING', 'GUEST_TO_HOST', 'HOST_TO_GUEST') NOT NULL,
    `rating` INTEGER UNSIGNED NOT NULL,
    `cleanliness` INTEGER UNSIGNED NULL,
    `location` INTEGER UNSIGNED NULL,
    `accuracy` INTEGER UNSIGNED NULL,
    `value` INTEGER UNSIGNED NULL,
    `comment` TEXT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reviews_reviewerId_idx`(`reviewerId`),
    INDEX `reviews_reviewedId_idx`(`reviewedId`),
    INDEX `reviews_listingId_idx`(`listingId`),
    INDEX `reviews_type_idx`(`type`),
    UNIQUE INDEX `reviews_bookingId_type_key`(`bookingId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER UNSIGNED NOT NULL,
    `senderId` INTEGER UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_conversationId_idx`(`conversationId`),
    INDEX `messages_senderId_idx`(`senderId`),
    INDEX `messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `listing_vectors` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER UNSIGNED NOT NULL,
    `vectorText` JSON NOT NULL,
    `textChunk` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `listing_vectors_listingId_key`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verifications` ADD CONSTRAINT `verifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otps` ADD CONSTRAINT `otps_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_location_insights` ADD CONSTRAINT `listing_location_insights_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `availability_blocks` ADD CONSTRAINT `availability_blocks_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_photos` ADD CONSTRAINT `listing_photos_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_amenities` ADD CONSTRAINT `listing_amenities_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_guestId_fkey` FOREIGN KEY (`guestId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_apartmentId_fkey` FOREIGN KEY (`apartmentId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_images` ADD CONSTRAINT `room_images_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewedId_fkey` FOREIGN KEY (`reviewedId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `dispute_conversations` ADD CONSTRAINT `dispute_conversations_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispute_conversations` ADD CONSTRAINT `dispute_conversations_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispute_messages` ADD CONSTRAINT `dispute_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `dispute_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispute_messages` ADD CONSTRAINT `dispute_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_vectors` ADD CONSTRAINT `listing_vectors_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
