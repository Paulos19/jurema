import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { uniqueCode, installmentId, amountPaid, accountId, paymentDate } = await request.json();

    if (!uniqueCode || !installmentId || !amountPaid || !accountId || !paymentDate) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }
    const paymentValue = new Prisma.Decimal(amountPaid);

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Busca a parcela e o empréstimo associado
      const installment = await tx.installment.findUnique({
        where: { id: installmentId },
        include: { loan: { include: { client: true } } },
      });

      if (!installment || installment.loan.userId !== user.id) {
        throw new Error('Parcela não encontrada ou não pertence a este usuário.');
      }
      if (installment.loan.status !== 'Aberto') {
        throw new Error('O empréstimo desta parcela não está mais "Aberto".');
      }

      // 2. Marca a parcela atual como paga com o valor parcial
      await tx.installment.update({
        where: { id: installmentId },
        data: { paidValue: paymentValue, status: 'Pago' },
      });

      // 3. Abate o valor pago do saldo devedor principal do empréstimo
      const updatedLoan = await tx.loan.update({
        where: { id: installment.loanId },
        data: {
          loanBalance: { decrement: paymentValue },
        },
      });
      
      // 4. Cria o registro da transação financeira
      await tx.transaction.create({ data: { accountId, title: `Pgto Parcial Parcela ${installment.codeId}`, value: paymentValue, type: 'Entrada', category: 'Pagamento', date: new Date(paymentDate) } });
      await tx.account.update({ where: { id: accountId }, data: { balance: { increment: paymentValue } } });

      // 5. Busca todas as parcelas restantes que ainda estão pendentes
      const remainingInstallments = await tx.installment.findMany({
        where: { loanId: installment.loanId, status: 'Pendente' },
        select: { id: true, dueDate: true }, // Seleciona apenas o necessário
        orderBy: { dueDate: 'asc' },
      });

      // 6. Prepara e retorna o payload de dados para a IA
      return {
        message: 'Amortização registrada. Dados preparados para recálculo pela IA.',
        recalcInfo: {
          loanId: installment.loanId,
          newPrincipal: updatedLoan.loanBalance, // O novo principal é o saldo devedor restante
          interestRate: installment.loan.interestRate,
          loanType: installment.loan.type,
          remainingInstallments: remainingInstallments,
        },
        paymentInfo: {
            paidAmount: paymentValue,
            clientName: installment.loan.client.name,
            clientWhatsapp: installment.loan.client.whatsapp,
            creditorPixKey: user.pixKey
        }
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erro ao amortizar e preparar para recálculo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}