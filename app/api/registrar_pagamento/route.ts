import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { uniqueCode, installmentId, amountPaid, accountId, paymentDate, description, quitLoan } = await request.json();

    if (!uniqueCode || !installmentId || amountPaid === undefined || !accountId || !paymentDate) {
      return NextResponse.json({ message: 'Missing required fields for payment registration' }, { status: 400 });
    }

    // Converta o valor pago para um Prisma.Decimal logo no início
    const paymentValue = new Prisma.Decimal(amountPaid);

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    // Utilize uma transação para garantir que todas as operações funcionem ou nenhuma delas
    const result = await prisma.$transaction(async (tx) => {
      const installment = await tx.installment.findUnique({
        where: { id: installmentId },
        include: { loan: { include: { client: true } } },
      });

      if (!installment || installment.loan.userId !== user.id) {
        throw new Error('Installment not found or does not belong to this user');
      }

      const account = await tx.account.findUnique({ where: { id: accountId, userId: user.id } });
      if (!account) {
        throw new Error('Account not found or does not belong to this user');
      }

      // Calcula o novo valor pago e o status
      const newPaidValue = installment.paidValue.plus(paymentValue);
      let newInstallmentStatus = installment.status;

      // Use .gte() para comparar Decimals
      if (newPaidValue.gte(installment.dueValue)) {
        newInstallmentStatus = 'Pago';
      }

      // 1. Atualiza a parcela
      const updatedInstallment = await tx.installment.update({
        where: { id: installmentId },
        data: {
          paidValue: {
            increment: paymentValue, // Forma correta de adicionar valor
          },
          status: newInstallmentStatus,
        },
      });

      // 2. Atualiza o saldo do empréstimo usando 'decrement'
      const updatedLoan = await tx.loan.update({
        where: { id: installment.loanId },
        data: {
          loanBalance: {
            decrement: paymentValue,
          },
          status: quitLoan ? 'Quitado' : installment.loan.status,
        },
      });
      
      // Se o saldo do empréstimo zerar ou ficar negativo após o pagamento, quita o empréstimo
      if (updatedLoan.loanBalance.isZero() || updatedLoan.loanBalance.isNegative()) {
          await tx.loan.update({
              where: {id: updatedLoan.id},
              data: {status: 'Quitado'}
          })
      }

      // 3. Cria o registo da transação
      await tx.transaction.create({
        data: {
          accountId,
          title: `Pagamento Parcela ${installment.codeId} - ${installment.loan.title}`,
          value: paymentValue,
          type: 'Entrada',
          description: description || `Pagamento recebido para parcela ${installment.codeId}`,
          category: 'Pagamento',
          date: new Date(paymentDate),
        },
      });

      // 4. Atualiza o saldo da conta usando 'increment'
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: paymentValue,
          },
        },
      });

      return { updatedInstallment, updatedLoan };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error registering payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}