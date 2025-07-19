import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { uniqueCode, installmentId, amountPaid, accountId, paymentDate, description } = await request.json();

    // 1. Validações de entrada
    if (!uniqueCode || !installmentId || !amountPaid || !accountId || !paymentDate) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes para registrar o pagamento.' }, { status: 400 });
    }
    const paymentValue = new Prisma.Decimal(amountPaid);

    // 2. Autenticação do Credor
    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }

    // 3. Busca a Parcela, o Empréstimo e a Conta em uma transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      const installment = await tx.installment.findUnique({
        where: { id: installmentId },
        include: { loan: true },
      });

      if (!installment || installment.loan.userId !== user.id) {
        throw new Error('Parcela não encontrada ou não pertence a este usuário.');
      }

      const account = await tx.account.findUnique({
        where: { id: accountId, userId: user.id },
      });
      if (!account) {
        throw new Error('Conta não encontrada ou não pertence a este usuário.');
      }

      const dueValue = installment.dueValue;
      let newInstallmentStatus = installment.status;

      // 4. Lógica Principal: Pagamento Integral vs. Amortização
      if (paymentValue.gte(dueValue)) {
        // --- PAGAMENTO INTEGRAL OU MAIOR ---
        newInstallmentStatus = 'Pago';
        await tx.installment.update({
          where: { id: installmentId },
          data: {
            paidValue: paymentValue, // Registra o valor exato pago
            status: newInstallmentStatus,
          },
        });
      } else {
        // --- LÓGICA DE AMORTIZAÇÃO (PAGAMENTO PARCIAL) ---
        const remainingDue = dueValue.minus(paymentValue);
        
        // 4.1. Marca a parcela original como 'Paga' (quitando sua obrigação original)
        await tx.installment.update({
            where: { id: installmentId },
            data: {
                paidValue: paymentValue, // Registra o valor que foi efetivamente pago
                status: 'Pago',
            },
        });

        // 4.2. Cria uma nova parcela com o valor restante
        await tx.installment.create({
          data: {
            loanId: installment.loanId,
            codeId: `${installment.codeId}-AMORT`, // Adiciona um sufixo para identificação
            dueValue: remainingDue,
            dueDate: installment.dueDate, // Mantém a data de vencimento original, mas poderia ser a próxima
            status: 'Pendente',
            paidValue: 0,
          },
        });
      }

      // 5. Atualiza o saldo devedor do empréstimo
      const updatedLoan = await tx.loan.update({
        where: { id: installment.loanId },
        data: {
          loanBalance: {
            decrement: paymentValue,
          },
        },
      });

      // 6. Cria a Transação financeira
      await tx.transaction.create({
        data: {
          accountId,
          title: `Pag. Parcela ${installment.codeId} - ${installment.loan.title}`,
          value: paymentValue,
          type: 'Entrada',
          description: description || `Pagamento recebido para a parcela ${installment.codeId}`,
          category: 'Pagamento',
          date: new Date(paymentDate),
        },
      });

      // 7. Atualiza o saldo da conta que recebeu o valor
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: paymentValue,
          },
        },
      });

      // 8. Se o saldo do empréstimo zerar ou ficar negativo, quita o empréstimo
      if (updatedLoan.loanBalance.isZero() || updatedLoan.loanBalance.isNegative()) {
          await tx.loan.update({
              where: {id: updatedLoan.id},
              data: {status: 'Quitado'}
          })
      }

      return { message: 'Pagamento registrado com sucesso!' };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido.';
    // Retorna 404 se a parcela ou conta não for encontrada para dar um feedback melhor ao n8n
    if (errorMessage.includes('não encontrada')) {
        return NextResponse.json({ message: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}