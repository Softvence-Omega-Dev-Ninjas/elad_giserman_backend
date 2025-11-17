/*
  Warnings:

  - You are about to drop the `payment_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."payment_transactions" DROP CONSTRAINT "payment_transactions_invoiceId_fkey";

-- DropTable
DROP TABLE "public"."payment_transactions";

-- DropEnum
DROP TYPE "public"."PaymentStatus";
