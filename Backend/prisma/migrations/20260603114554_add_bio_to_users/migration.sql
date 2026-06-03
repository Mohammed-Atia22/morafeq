/*
  Warnings:

  - A unique constraint covering the columns `[phoneHash]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `gender` ENUM('male', 'female') NOT NULL DEFAULT 'male',
    ADD COLUMN `phoneCountry` VARCHAR(2) NULL,
    ADD COLUMN `phoneCountryCode` VARCHAR(5) NULL,
    ADD COLUMN `phoneHash` VARCHAR(64) NULL,
    MODIFY `phone` TEXT NULL;

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

-- CreateIndex
CREATE UNIQUE INDEX `users_phoneHash_key` ON `users`(`phoneHash`);

-- CreateIndex
CREATE INDEX `users_phoneCountry_idx` ON `users`(`phoneCountry`);

-- CreateIndex
CREATE INDEX `users_phoneCountryCode_idx` ON `users`(`phoneCountryCode`);

-- AddForeignKey
ALTER TABLE `otps` ADD CONSTRAINT `otps_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
