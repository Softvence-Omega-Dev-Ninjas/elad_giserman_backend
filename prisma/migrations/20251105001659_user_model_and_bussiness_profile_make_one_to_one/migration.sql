/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `business_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_ownerId_key" ON "business_profiles"("ownerId");
