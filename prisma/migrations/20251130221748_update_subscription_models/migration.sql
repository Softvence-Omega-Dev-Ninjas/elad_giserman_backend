/*
  Warnings:

  - You are about to drop the column `amountCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `paidCents` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `userSubscriptionId` on the `invoices` table. All the data in the column will be lost.
  - Added the required column `amount` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Made the column `stripeInvoiceId` on table `invoices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_userSubscriptionId_fkey";

-- DropIndex
DROP INDEX "invoices_invoiceNumber_key";

-- DropIndex
DROP INDEX "invoices_status_idx";

-- DropIndex
DROP INDEX "invoices_userSubscriptionId_idx";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "amountCents",
DROP COLUMN "dueDate",
DROP COLUMN "invoiceNumber",
DROP COLUMN "paidCents",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
DROP COLUMN "userSubscriptionId",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "stripeInvoiceId" SET NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "billingCycle" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
