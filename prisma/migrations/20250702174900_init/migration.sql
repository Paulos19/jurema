-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('Entrada', 'Saída', 'Transferencia');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PercentualDosJuros', 'ValorDaParcela', 'ApenasJuros', 'JurosSimples');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('Aberto', 'Quitado', 'Atrasado', 'Cancelado');

-- CreateEnum
CREATE TYPE "RecurrencePeriod" AS ENUM ('UmaUnicaVez', 'Diario', 'Semanal', 'Quinzenal', 'Mensal');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('Pendente', 'Pago', 'Atrasado');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "pix_key" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "profit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pix_associated" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "whatsapp" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "photo_url" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "observations" TEXT,
    "total_loaned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "code_id" TEXT NOT NULL,
    "loaned_value" DECIMAL(10,2) NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LoanType" NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "installments_quantity" INTEGER NOT NULL,
    "recurrence_period" "RecurrencePeriod" NOT NULL,
    "loan_balance" DECIMAL(10,2) NOT NULL,
    "original_due_value" DECIMAL(10,2) NOT NULL,
    "daily_fine_value" DECIMAL(10,2),
    "loan_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "code_id" TEXT NOT NULL,
    "due_value" DECIMAL(10,2) NOT NULL,
    "paid_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "days_late" INTEGER,
    "total_fine" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clients_cpf_key" ON "clients"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "loans_code_id_key" ON "loans"("code_id");

-- CreateIndex
CREATE UNIQUE INDEX "installments_code_id_key" ON "installments"("code_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
