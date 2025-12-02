-- AlterTable
ALTER TABLE "UserTermsAndConditions" ADD COLUMN     "businessProfileId" TEXT;

-- AddForeignKey
ALTER TABLE "UserTermsAndConditions" ADD CONSTRAINT "UserTermsAndConditions_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
