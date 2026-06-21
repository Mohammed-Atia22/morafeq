-- CreateTable
CREATE TABLE `roommate_profiles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `occupationType` ENUM('STUDENT', 'EMPLOYEE', 'FREELANCER', 'OTHER') NULL,
    `university` VARCHAR(150) NULL,
    `faculty` VARCHAR(150) NULL,
    `academicYear` VARCHAR(50) NULL,
    `occupation` VARCHAR(150) NULL,
    `workField` VARCHAR(150) NULL,
    `ageRange` ENUM('UNDER_18', 'AGE_18_20', 'AGE_21_23', 'AGE_24_26', 'AGE_27_30', 'ABOVE_30') NULL,
    `interests` JSON NULL,
    `sleepSchedule` ENUM('EARLY', 'NORMAL', 'LATE', 'VARIABLE') NULL,
    `studyFrequency` ENUM('RARELY', 'SOMETIMES', 'OFTEN') NULL,
    `cleanlinessLevel` ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NULL,
    `smokingStatus` ENUM('NON_SMOKER', 'SMOKER', 'OCCASIONAL') NULL,
    `smokingTolerance` ENUM('NEVER', 'OUTSIDE_ONLY', 'OK') NULL,
    `guestPreference` ENUM('NO_GUESTS', 'WITH_NOTICE', 'SOMETIMES', 'OFTEN') NULL,
    `privacyLevel` ENUM('HIGH', 'MEDIUM', 'SOCIAL') NULL,
    `cookingFrequency` ENUM('RARELY', 'SOMETIMES', 'DAILY') NULL,
    `expenseStyle` ENUM('EQUAL', 'BY_USAGE', 'AGREEMENT') NULL,
    `conflictStyle` ENUM('DIRECT_CALM', 'INFORM_HOST', 'AVOID') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roommate_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roommate_profiles` ADD CONSTRAINT `roommate_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
