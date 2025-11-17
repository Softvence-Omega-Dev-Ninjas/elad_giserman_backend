-- CreateTable
CREATE TABLE "Spin" (
    "id" TEXT NOT NULL,
    "spinValue1" INTEGER,
    "spinValue2" INTEGER,
    "spinValue3" INTEGER,
    "spinValue4" INTEGER,
    "spinValue5" INTEGER,
    "spinValue6" INTEGER,
    "spinValue7" INTEGER,
    "spinValue8" INTEGER,
    "spinValue9" INTEGER,
    "spinValue10" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spin_pkey" PRIMARY KEY ("id")
);
