-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3);
