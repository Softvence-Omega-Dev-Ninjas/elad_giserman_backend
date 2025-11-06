-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "status" "OfferStatus" NOT NULL DEFAULT 'PENDING';
