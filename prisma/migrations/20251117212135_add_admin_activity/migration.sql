-- CreateTable
CREATE TABLE "AdminActivity" (
    "id" TEXT NOT NULL,
    "stripeConnectionStatus" BOOLEAN DEFAULT false,
    "appleConnection" BOOLEAN DEFAULT false,
    "googleConnection" BOOLEAN DEFAULT false,
    "apiKeys" TEXT,
    "subscriptionStatus" BOOLEAN DEFAULT false,
    "reedemtionStatus" BOOLEAN DEFAULT false,
    "pushNotifications" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);
