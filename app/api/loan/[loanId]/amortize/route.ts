import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const { uniqueCode, amount, accountId, paymentDate } = await request.json();

    // 1. Validações de entrada
    if (!uniqueCode || !loanId || !amount || !accountId || !paymentDate) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios: uniqueCode, loanId, amount, accountId, paymentDate' }, { status: 400 });
    }
    const amortizationAmount = new Prisma.Decimal(amount);

    // 2. Autenticação do Credor
    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }

    // 3. Execução da Lógica Transacional
    const result = await prisma.$transaction(async (tx) => {
      // Busca o empréstimo original
      const loan = await tx.loan.findUnique({
        where: { id: loanId, userId: user.id },
      });
      if (!loan) {
        throw new Error('Empréstimo não encontrado ou não pertence a este usuário.');
      }
      if (loan.status !== 'Aberto') {
        throw new Error('Apenas empréstimos com status "Aberto" podem ser amortizados.');
      }
      
      // --- CORREÇÃO APLICADA AQUI ---
      // Verifica se a taxa de juros existe antes de usá-la
      if (loan.interestRate === null) {
        throw new Error('Este empréstimo não possui uma taxa de juros definida e não pode ser recalculado.');
      }
      // -----------------------------

      // Calcula o novo saldo devedor principal
      const newPrincipal = loan.loanedValue.minus(amortizationAmount);
      if (newPrincipal.isNegative()) {
          throw new Error('O valor da amortização não pode ser maior que o valor principal do empréstimo.');
      }

      // Busca e deleta todas as parcelas futuras que ainda não foram pagas
      const pendingInstallments = await tx.installment.findMany({
        where: { loanId: loan.id, status: 'Pendente' }
      });
      
      if (pendingInstallments.length === 0) {
        throw new Error('Não há parcelas pendentes para recalcular.');
      }
      
      await tx.installment.deleteMany({
        where: { id: { in: pendingInstallments.map(p => p.id) } }
      });
      
      // Lógica para recalcular o valor da nova parcela
      let newInstallmentValue = new Prisma.Decimal(0);
      if (loan.type === 'JurosSimples') {
          const interestPerInstallment = newPrincipal.times(loan.interestRate.div(100));
          const principalPerInstallment = newPrincipal.div(pendingInstallments.length);
          newInstallmentValue = principalPerInstallment.plus(interestPerInstallment);
      } else if (loan.type === 'PercentualDosJuros') {
          newInstallmentValue = newPrincipal.times(new Prisma.Decimal(1).plus(loan.interestRate.div(100))).div(pendingInstallments.length);
      } else {
          throw new Error(`Recálculo para o tipo de empréstimo '${loan.type}' não implementado.`);
      }

      // Cria as novas parcelas recalculadas
      const newInstallmentsData = pendingInstallments.map((inst) => ({
        loanId: loan.id,
        codeId: `${inst.codeId}-RECALC`,
        dueValue: newInstallmentValue,
        dueDate: inst.dueDate,
        status: 'Pendente' as const,
        paidValue: 0,
      }));
      await tx.installment.createMany({ data: newInstallmentsData });

      // Atualiza o empréstimo com o novo valor principal
      await tx.loan.update({
        where: { id: loanId },
        data: {
          loanedValue: newPrincipal,
          loanBalance: {
            decrement: amortizationAmount,
          }
        },
      });

      // Cria a transação de entrada para a amortização
      await tx.transaction.create({
        data: {
          accountId,
          title: `Amortização Empréstimo ${loan.codeId}`,
          value: amortizationAmount,
          type: 'Entrada',
          description: `Amortização do principal para o empréstimo "${loan.title}"`,
          category: 'Amortização',
          date: new Date(paymentDate),
        },
      });

      // Atualiza o saldo da conta que recebeu o valor
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amortizationAmount } },
      });

      return {
        message: 'Amortização realizada e parcelas recalculadas com sucesso!',
        newInstallmentValue: newInstallmentValue.toFixed(2),
        remainingInstallments: pendingInstallments.length
      };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Erro ao amortizar empréstimo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}