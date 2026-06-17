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

ALTER TABLE `users`
  ADD COLUMN `verificationStatus` ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN `trustScore` INTEGER UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE `verifications`
  ADD CONSTRAINT `verifications_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
