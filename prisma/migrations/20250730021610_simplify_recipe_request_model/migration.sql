/*
  Warnings:

  - You are about to drop the column `user_id` on the `recipe_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "recipe_requests" DROP CONSTRAINT "recipe_requests_user_id_fkey";

-- AlterTable
ALTER TABLE "recipe_requests" DROP COLUMN "user_id",
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "recipe_requests" ADD CONSTRAINT "recipe_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
