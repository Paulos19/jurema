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
      
      const dueValue = installment.dueValue;
      let operationSummary: any = { type: 'full_payment', paidAmount: paymentValue, installmentCode: installment.codeId, originalDueValue: dueValue };

      // --- LÓGICA PRINCIPAL: PAGAMENTO INTEGRAL VS. AMORTIZAÇÃO ---
      if (paymentValue.gte(dueValue)) {
        // --- PAGAMENTO INTEGRAL ---
        await tx.installment.update({
          where: { id: installmentId },
          data: { paidValue: paymentValue, status: 'Pago' },
        });
      } else {
        // --- AMORTIZAÇÃO COM DILUIÇÃO ---
        const remainingDue = dueValue.minus(paymentValue);
        
        // 1. Marca a parcela atual como paga
        await tx.installment.update({
          where: { id: installmentId },
          data: { paidValue: paymentValue, status: 'Pago' },
        });

        // 2. Encontra as outras parcelas pendentes para diluir o valor
        const otherPendingInstallments = await tx.installment.findMany({
          where: { loanId: installment.loanId, status: 'Pendente', NOT: { id: installmentId } },
          orderBy: { dueDate: 'asc' }
        });

        if (otherPendingInstallments.length > 0) {
          const dilutionAmount = remainingDue.div(otherPendingInstallments.length);
          
          // 3. Atualiza cada parcela futura, adicionando o valor diluído
          for (const pending of otherPendingInstallments) {
            await tx.installment.update({
              where: { id: pending.id },
              data: { dueValue: { increment: dilutionAmount } },
            });
          }
          const newInstallmentValue = otherPendingInstallments[0].dueValue.plus(dilutionAmount);
          operationSummary = {
              ...operationSummary,
              type: 'amortization_dilution',
              remainingAmount: remainingDue,
              dilutedIn: otherPendingInstallments.length,
              newInstallmentValue: newInstallmentValue
          };
        } else {
            // Se não houver parcelas futuras, cria uma nova com o valor restante
            const nextDueDate = new Date(installment.dueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + 1); // Exemplo: joga para o próximo mês
            
            await tx.installment.create({
                data: {
                    loanId: installment.loanId,
                    codeId: `${installment.codeId}-RESTANTE`,
                    dueValue: remainingDue,
                    dueDate: nextDueDate,
                    status: 'Pendente',
                }
            });
            operationSummary = { ...operationSummary, type: 'amortization_new_installment', remainingAmount: remainingDue };
        }
      }

      // --- OPERAÇÕES COMUNS ---
      const updatedLoan = await tx.loan.update({
        where: { id: installment.loanId },
        data: { loanBalance: { decrement: paymentValue } },
      });

      if (updatedLoan.loanBalance.isZero() || updatedLoan.loanBalance.isNegative()) {
        await tx.loan.update({ where: { id: updatedLoan.id }, data: { status: 'Quitado' } });
        operationSummary.loanStatus = 'Quitado';
      }

      await tx.transaction.create({ data: { accountId, title: `Pag. Parcela ${installment.codeId}`, value: paymentValue, type: 'Entrada', category: 'Pagamento', date: new Date(paymentDate) } });
      await tx.account.update({ where: { id: accountId }, data: { balance: { increment: paymentValue } } });

      return {
        summary: operationSummary,
        client: { name: installment.loan.client.name, whatsapp: installment.loan.client.whatsapp },
        creditor: { pixKey: user.pixKey }
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}