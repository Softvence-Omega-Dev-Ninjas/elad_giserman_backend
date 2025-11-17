-- CreateTable
CREATE TABLE "CustomApp" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "bannerCard" TEXT,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomApp_pkey" PRIMARY KEY ("id")
);
