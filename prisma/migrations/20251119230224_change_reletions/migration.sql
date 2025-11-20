/*
  Warnings:

  - You are about to drop the column `spinId` on the `SpinHistory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."SpinHistory" DROP CONSTRAINT "SpinHistory_spinId_fkey";

-- AlterTable
ALTER TABLE "SpinHistory" DROP COLUMN "spinId";
