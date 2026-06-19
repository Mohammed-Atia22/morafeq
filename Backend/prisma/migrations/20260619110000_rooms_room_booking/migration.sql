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

CREATE TABLE `room_images` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `roomId` INTEGER UNSIGNED NOT NULL,
  `imageUrl` VARCHAR(500) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `room_images_roomId_idx`(`roomId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `bookings`
  ADD COLUMN `roomId` INTEGER UNSIGNED NULL,
  ADD COLUMN `selectedRoomName` VARCHAR(100) NULL,
  ADD INDEX `bookings_roomId_idx`(`roomId`);

ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_apartmentId_fkey`
  FOREIGN KEY (`apartmentId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `room_images`
  ADD CONSTRAINT `room_images_roomId_fkey`
  FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_roomId_fkey`
  FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
