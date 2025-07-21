import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!loanId || !uniqueCode) {
      return NextResponse.json({ message: 'Loan ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId, userId: user.id },
      include: { installments: true }, // Include installments related to the loan
    });

    if (!loan) {
      return NextResponse.json({ message: 'Loan not found or does not belong to this user' }, { status: 404 });
    }

    return NextResponse.json(loan, { status: 200 });
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const body = await request.json();
    const { uniqueCode, loanedValue, title, ...otherData } = body;

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    // --- LÓGICA DE RECÁLCULO ---
    // Verifica se o 'loanedValue' foi alterado.
    if (loanedValue !== undefined) {
      const result = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id: loanId, userId: user.id },
        });

        if (!loan) {
          throw new Error('Empréstimo não encontrado.');
        }

        const newLoanedValue = new Prisma.Decimal(loanedValue);

        // 1. Apaga todas as parcelas futuras que ainda estão pendentes.
        const pendingInstallments = await tx.installment.findMany({
          where: { loanId: loan.id, status: 'Pendente' },
          orderBy: { dueDate: 'asc' },
        });

        if (pendingInstallments.length === 0) {
          throw new Error('Não há parcelas pendentes para recalcular. A edição não é permitida.');
        }

        await tx.installment.deleteMany({
          where: { id: { in: pendingInstallments.map(p => p.id) } },
        });

        // 2. Recalcula o valor da nova parcela (lógica similar à da IA no n8n).
        let newInstallmentValue: Prisma.Decimal;
        const interestRate = loan.interestRate ?? new Prisma.Decimal(0); // Garante que a taxa de juro não é nula
        const remainingInstallmentsCount = pendingInstallments.length;

        if (loan.type === 'JurosSimples') {
          const interestPart = newLoanedValue.times(interestRate.div(100));
          const principalPart = newLoanedValue.div(remainingInstallmentsCount);
          newInstallmentValue = principalPart.plus(interestPart);
        } else if (loan.type === 'PercentualDosJuros') {
          newInstallmentValue = newLoanedValue.times(new Prisma.Decimal(1).plus(interestRate.div(100))).div(remainingInstallmentsCount);
        } else {
          // Para outros tipos, podemos apenas dividir o novo valor
          newInstallmentValue = newLoanedValue.div(remainingInstallmentsCount);
        }

        // 3. Cria as novas parcelas recalculadas.
        const newInstallmentsData = pendingInstallments.map((inst, index) => ({
          loanId: loan.id,
          codeId: `${inst.codeId}-ED${index + 1}`, // Adiciona um sufixo para indicar que foi editada
          dueValue: newInstallmentValue.toDP(2), // Arredonda para 2 casas decimais
          dueDate: inst.dueDate,
          status: 'Pendente' as const,
        }));

        await tx.installment.createMany({
          data: newInstallmentsData,
        });
        
        // 4. Calcula o novo saldo devedor
        const totalPaid = await tx.installment.aggregate({
            _sum: { paidValue: true },
            where: { loanId: loan.id, status: 'Pago' }
        });
        const newLoanBalance = newLoanedValue.minus(totalPaid._sum.paidValue ?? 0);

        // 5. Finalmente, atualiza o empréstimo com os novos valores.
        const updatedLoan = await tx.loan.update({
          where: { id: loanId },
          data: {
            title: title || loan.title,
            loanedValue: newLoanedValue,
            loanBalance: newLoanBalance,
            ...otherData,
          },
        });

        return { updatedLoan, newInstallmentsData };
      });

      return NextResponse.json({ message: 'Empréstimo atualizado e parcelas recalculadas com sucesso!', ...result }, { status: 200 });

    } else {
      // Se o 'loanedValue' não foi alterado, faz uma atualização simples.
      const updatedLoan = await prisma.loan.update({
        where: { id: loanId, userId: user.id },
        data: { title, ...otherData },
      });
      return NextResponse.json(updatedLoan, { status: 200 });
    }
  } catch (error) {
    console.error('Error updating loan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!loanId || !uniqueCode) {
      return NextResponse.json({ message: 'Loan ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    await prisma.loan.delete({
      where: { id: loanId, userId: user.id },
    });

    return NextResponse.json({ message: 'Loan deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
