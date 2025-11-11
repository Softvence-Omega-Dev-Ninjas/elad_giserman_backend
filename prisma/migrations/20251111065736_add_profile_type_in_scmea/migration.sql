-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('CAFE', 'RESTURANTES', 'BAR');

-- AlterTable
ALTER TABLE "business_profiles" ADD COLUMN     "profileType" "ProfileType";
