/*
  Warnings:

  - You are about to drop the column `account` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `adminRight` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `businesses` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `dataAndPolicy` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `governingLaw` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `offerAndRedemtions` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `reservations` on the `UserTermsAndConditions` table. All the data in the column will be lost.
  - You are about to drop the column `subscription` on the `UserTermsAndConditions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserTermsAndConditions" DROP COLUMN "account",
DROP COLUMN "adminRight",
DROP COLUMN "businesses",
DROP COLUMN "dataAndPolicy",
DROP COLUMN "governingLaw",
DROP COLUMN "offerAndRedemtions",
DROP COLUMN "reservations",
DROP COLUMN "subscription",
ADD COLUMN     "arrvalAndSeatingPolicy" TEXT[],
ADD COLUMN     "canceletionAndNoShows" TEXT[],
ADD COLUMN     "conductAndBehaviour" TEXT[],
ADD COLUMN     "generalAgrement" TEXT,
ADD COLUMN     "modifications" TEXT[],
ADD COLUMN     "policyUpdate" TEXT,
ADD COLUMN     "reservationConfirmation" TEXT[];
