/*
  Warnings:

  - You are about to drop the column `spinValue10` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue2` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue3` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue4` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue5` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue6` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue7` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue8` on the `Spin` table. All the data in the column will be lost.
  - You are about to drop the column `spinValue9` on the `Spin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Spin" DROP COLUMN "spinValue10",
DROP COLUMN "spinValue2",
DROP COLUMN "spinValue3",
DROP COLUMN "spinValue4",
DROP COLUMN "spinValue5",
DROP COLUMN "spinValue6",
DROP COLUMN "spinValue7",
DROP COLUMN "spinValue8",
DROP COLUMN "spinValue9";

-- DropEnum
DROP TYPE "ProfileType";
