-- DropForeignKey
ALTER TABLE "UserTermsAndConditions" DROP CONSTRAINT "UserTermsAndConditions_businessProfileId_fkey";

-- AddForeignKey
ALTER TABLE "UserTermsAndConditions" ADD CONSTRAINT "UserTermsAndConditions_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
