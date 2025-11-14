/*
  Warnings:

  - You are about to drop the column `amountDueCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaidCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `discountCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `feeCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `taxCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `attemptedAt` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `failureCode` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `feeCents` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `netCents` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `stripeChargeId` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `userSubscriptionId` on the `payment_transactions` table. All the data in the column will be lost.
  - Added the required column `amountCents` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoiceId` on table `payment_transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."payment_transactions" DROP CONSTRAINT "payment_transactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_transactions" DROP CONSTRAINT "payment_transactions_userSubscriptionId_fkey";

-- DropIndex
DROP INDEX "public"."payment_transactions_stripeChargeId_key";

-- DropIndex
DROP INDEX "public"."payment_transactions_userId_idx";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "amountDueCents",
DROP COLUMN "amountPaidCents",
DROP COLUMN "discountCents",
DROP COLUMN "feeCents",
DROP COLUMN "taxCents",
ADD COLUMN     "amountCents" INTEGER NOT NULL,
ADD COLUMN     "paidCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "attemptedAt",
DROP COLUMN "failureCode",
DROP COLUMN "feeCents",
DROP COLUMN "netCents",
DROP COLUMN "receiptUrl",
DROP COLUMN "refundedAt",
DROP COLUMN "stripeChargeId",
DROP COLUMN "userId",
DROP COLUMN "userSubscriptionId",
ALTER COLUMN "invoiceId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");
