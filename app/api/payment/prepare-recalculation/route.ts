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

      await tx.installment.update({
        where: { id: installmentId },
        data: { paidValue: paymentValue, status: 'Pago' },
      });

      // --- CORREÇÃO APLICADA AQUI ---
      // Calcula a redução do principal. Se não houver juros, a redução é o valor total pago.
      const interestValue = installment.loan.interestRate 
          ? installment.loan.loanedValue.times(installment.loan.interestRate.div(100)) 
          : new Prisma.Decimal(0);
          
      const principalReduction = paymentValue.minus(interestValue);

      const updatedLoan = await tx.loan.update({
          where: { id: installment.loanId },
          data: {
              // Usa .isGreaterThan() para comparar o Decimal com zero
              loanedValue: { decrement: principalReduction.greaterThan(0) ? principalReduction : 0 },
              loanBalance: { decrement: paymentValue },
          },
      });
      // -----------------------------

      await tx.transaction.create({ data: { accountId, title: `Pgto Parcela ${installment.codeId}`, value: paymentValue, type: 'Entrada', category: 'Pagamento', date: new Date(paymentDate) } });
      await tx.account.update({ where: { id: accountId }, data: { balance: { increment: paymentValue } } });

      const remainingInstallments = await tx.installment.findMany({
        where: { loanId: installment.loanId, status: 'Pendente' },
        select: { id: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
      });

      return {
        message: 'Pagamento registrado. Dados preparados para recálculo pela IA.',
        recalcInfo: {
          loanId: installment.loanId,
          newPrincipal: updatedLoan.loanedValue,
          interestRate: installment.loan.interestRate,
          loanType: installment.loan.type,
          remainingInstallments: remainingInstallments,
        },
        paymentInfo: {
            paidAmount: paymentValue,
            originalInstallmentValue: installment.dueValue,
            clientName: installment.loan.client.name,
            clientWhatsapp: installment.loan.client.whatsapp,
            creditorPixKey: user.pixKey
        }
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erro ao registrar pagamento e preparar recálculo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}