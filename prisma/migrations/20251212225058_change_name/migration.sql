/*
  Warnings:

  - You are about to drop the column `isClailmed` on the `redeemable_offers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "redeemable_offers" DROP COLUMN "isClailmed",
ADD COLUMN     "isClaimed" BOOLEAN DEFAULT false;
