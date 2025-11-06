/*
  Warnings:

  - You are about to drop the column `details` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `offers` table. All the data in the column will be lost.
  - Added the required column `title` to the `offers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "offers" DROP COLUMN "details",
DROP COLUMN "endDate",
DROP COLUMN "name",
DROP COLUMN "startDate",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."OfferStatus";

-- DropEnum
DROP TYPE "public"."OfferType";
