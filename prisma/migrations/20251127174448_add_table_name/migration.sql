/*
  Warnings:

  - You are about to drop the `Spin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Spin";

-- CreateTable
CREATE TABLE "spin" (
    "id" TEXT NOT NULL,
    "spinValue1" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spin_pkey" PRIMARY KEY ("id")
);
