-- AlterTable
ALTER TABLE "users" ADD COLUMN "name" TEXT;

-- Update existing rows
UPDATE "users" SET "name" = 'Nome a ser atualizado' WHERE "name" IS NULL;

-- Make column NOT NULL
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;