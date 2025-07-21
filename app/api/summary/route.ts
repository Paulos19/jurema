// app/api/summary/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!uniqueCode) {
      return NextResponse.json({ message: 'O código único do credor é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido' }, { status: 401 });
    }

    // Usamos agregações do Prisma para calcular os totais de forma eficiente
    const totalLoaned = await prisma.loan.aggregate({
      _sum: {
        loanedValue: true,
      },
      where: {
        userId: user.id,
      },
    });

    const totalBalance = await prisma.loan.aggregate({
      _sum: {
        loanBalance: true,
      },
      where: {
        userId: user.id,
        status: 'Aberto',
      },
    });
    
    const activeClientsCount = await prisma.client.count({
        where: {
            userId: user.id,
            loans: {
                some: {
                    status: 'Aberto'
                }
            }
        }
    });

    const overdueInstallmentsCount = await prisma.installment.count({
      where: {
        status: 'Atrasado',
        loan: {
          userId: user.id,
        },
      },
    });

    const summary = {
      totalLoaned: totalLoaned._sum.loanedValue ?? new Prisma.Decimal(0),
      totalBalance: totalBalance._sum.loanBalance ?? new Prisma.Decimal(0),
      activeClientsCount: activeClientsCount,
      overdueInstallmentsCount: overdueInstallmentsCount,
    };

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar resumo da carteira:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}