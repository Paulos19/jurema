-- CreateTable
CREATE TABLE "recipe_requests" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "rawData" TEXT NOT NULL,
    "jsonData" JSONB,
    "solicitado_por" TEXT NOT NULL,
    "solicitado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "recipe_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recipe_requests" ADD CONSTRAINT "recipe_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
