-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('IDLE', 'PENDING_CLIENT_NAME', 'PENDING_CLIENT_CPF', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_whatsapp" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'IDLE',
    "current_step" TEXT,
    "data_collected" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
