/*
  Warnings:

  - A unique constraint covering the columns `[abacatepay_customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abacatepay_billing_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE_TRIAL', 'ACTIVE', 'OVERDUE', 'INACTIVE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "abacatepay_billing_id" TEXT,
ADD COLUMN     "abacatepay_customer_id" TEXT,
ADD COLUMN     "subscription_due_date" TIMESTAMP(3),
ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'FREE_TRIAL',
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_abacatepay_customer_id_key" ON "users"("abacatepay_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_abacatepay_billing_id_key" ON "users"("abacatepay_billing_id");
