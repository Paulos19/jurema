// app/api/client/by-cpf/[cpf]/summary/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request, { params }: { params: { cpf: string } }) {
  try {
    const { cpf } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!cpf || !uniqueCode) {
      return NextResponse.json({ message: 'CPF do cliente e seu código único são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido' }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: { cpf: cpf, userId: user.id },
      include: {
        loans: {
          include: {
            installments: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ message: 'Cliente não encontrado com este CPF.' }, { status: 404 });
    }

    let totalLoaned = new Prisma.Decimal(0);
    let totalPaid = new Prisma.Decimal(0);

    for (const loan of client.loans) {
      totalLoaned = totalLoaned.plus(loan.loanedValue);
      for (const installment of loan.installments) {
        totalPaid = totalPaid.plus(installment.paidValue);
      }
    }

    const outstandingBalance = totalLoaned.minus(totalPaid);
    const activeLoansCount = client.loans.filter(loan => loan.status === 'Aberto').length;
    const paidLoansCount = client.loans.filter(loan => loan.status === 'Quitado').length;

    const summary = {
      clientName: client.name,
      totalLoaned: totalLoaned.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      outstandingBalance: outstandingBalance.toFixed(2),
      activeLoansCount,
      paidLoansCount,
      totalLoans: client.loans.length,
    };

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar resumo do cliente:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}