-- Drop old TermsAndConditions table and recreate with new structure
DROP TABLE IF EXISTS "TermsAndConditions";

-- CreateTable
CREATE TABLE "TermsAndConditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermsAndConditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT[],
    "order" INTEGER NOT NULL,
    "termsId" TEXT NOT NULL,

    CONSTRAINT "TermsSection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TermsSection" ADD CONSTRAINT "TermsSection_termsId_fkey" FOREIGN KEY ("termsId") REFERENCES "TermsAndConditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
