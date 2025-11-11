-- CreateEnum
CREATE TYPE "MemberShip" AS ENUM ('FREE', 'VIP');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "memberShip" "MemberShip" NOT NULL DEFAULT 'FREE';
