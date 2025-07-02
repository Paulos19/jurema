/*
  Warnings:

  - A unique constraint covering the columns `[unique_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "unique_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_unique_code_key" ON "users"("unique_code");
