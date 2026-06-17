/*
  Warnings:

  - You are about to drop the column `stripeChargeId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `stripeRefundId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymobOrderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymobTransactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Made the column `hostPayoutAmount` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `platformFee` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `payments_stripePaymentIntentId_idx` ON `payments`;

-- DropIndex
DROP INDEX `payments_stripePaymentIntentId_key` ON `payments`;

-- AlterTable
ALTER TABLE `payments` DROP COLUMN `stripeChargeId`,
    DROP COLUMN `stripePaymentIntentId`,
    DROP COLUMN `stripeRefundId`,
    ADD COLUMN `paymentMethod` VARCHAR(50) NULL,
    ADD COLUMN `paymobOrderId` VARCHAR(255) NULL,
    ADD COLUMN `paymobTransactionId` VARCHAR(255) NULL,
    MODIFY `hostPayoutAmount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `platformFee` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `currency` VARCHAR(3) NOT NULL DEFAULT 'EGP';

-- CreateIndex
CREATE UNIQUE INDEX `payments_paymobOrderId_key` ON `payments`(`paymobOrderId`);

-- CreateIndex
CREATE UNIQUE INDEX `payments_paymobTransactionId_key` ON `payments`(`paymobTransactionId`);

-- CreateIndex
CREATE INDEX `payments_paymobOrderId_idx` ON `payments`(`paymobOrderId`);

-- CreateIndex
CREATE INDEX `payments_paymobTransactionId_idx` ON `payments`(`paymobTransactionId`);
