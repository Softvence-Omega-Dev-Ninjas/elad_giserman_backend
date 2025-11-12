/*
  Warnings:

  - A unique constraint covering the columns `[bussinessId]` on the table `redeemable_offers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bussinessId` to the `redeemable_offers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "redeemable_offers" ADD COLUMN     "bussinessId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "redeemable_offers_bussinessId_key" ON "redeemable_offers"("bussinessId");

-- AddForeignKey
ALTER TABLE "redeemable_offers" ADD CONSTRAINT "redeemable_offers_bussinessId_fkey" FOREIGN KEY ("bussinessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
