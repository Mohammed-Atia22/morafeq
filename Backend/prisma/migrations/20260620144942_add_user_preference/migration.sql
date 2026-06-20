-- CreateTable
CREATE TABLE `user_preferences` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `preferenceKey` VARCHAR(50) NOT NULL,

    INDEX `user_preferences_userId_idx`(`userId`),
    UNIQUE INDEX `user_preferences_userId_preferenceKey_key`(`userId`, `preferenceKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
