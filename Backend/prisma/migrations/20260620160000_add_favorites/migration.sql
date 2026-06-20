CREATE TABLE `favorites` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INTEGER UNSIGNED NOT NULL,
  `listingId` INTEGER UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `favorites_userId_idx`(`userId`),
  INDEX `favorites_listingId_idx`(`listingId`),
  UNIQUE INDEX `favorites_userId_listingId_key`(`userId`, `listingId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_listingId_fkey`
  FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
