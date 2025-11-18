-- CreateTable
CREATE TABLE "UserTermsAndConditions" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "subscription" TEXT[],
    "offerAndRedemtions" TEXT[],
    "reservations" TEXT[],
    "businesses" TEXT[],
    "adminRight" TEXT[],
    "dataAndPolicy" TEXT NOT NULL,
    "liability" TEXT NOT NULL,
    "governingLaw" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTermsAndConditions_pkey" PRIMARY KEY ("id")
);
