-- AlterTable
ALTER TABLE `roommate_profiles` ADD COLUMN `preferredCity` VARCHAR(100) NULL,
    ADD COLUMN `preferredGovernorate` VARCHAR(100) NULL,
    ADD COLUMN `preferredMaxRent` INTEGER UNSIGNED NULL,
    ADD COLUMN `preferredMinRent` INTEGER UNSIGNED NULL,
    ADD COLUMN `preferredRoomType` ENUM('ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM') NULL;
