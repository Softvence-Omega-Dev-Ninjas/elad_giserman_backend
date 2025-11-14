/*
  Warnings:

  - You are about to drop the column `priceId` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the `ReviewReply` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripeDefaultPaymentMethodId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ReviewReply" DROP CONSTRAINT "ReviewReply_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReviewReply" DROP CONSTRAINT "ReviewReply_userId_fkey";

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "priceId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeDefaultPaymentMethodId" TEXT;

-- DropTable
DROP TABLE "public"."ReviewReply";

-- CreateTable
CREATE TABLE "review_replies" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeDefaultPaymentMethodId_key" ON "users"("stripeDefaultPaymentMethodId");

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
