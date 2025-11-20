-- CreateTable
CREATE TABLE "SpinHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spinId" TEXT NOT NULL,
    "result" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpinHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpinHistory" ADD CONSTRAINT "SpinHistory_spinId_fkey" FOREIGN KEY ("spinId") REFERENCES "Spin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
