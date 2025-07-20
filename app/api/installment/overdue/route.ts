// app/api/installments/overdue/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay } from 'date-fns';

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

    const today = startOfDay(new Date());

    // CORREÇÃO: Utilizando findMany para retornar todas as parcelas
    const overdueInstallments = await prisma.installment.findMany({
      where: {
        status: 'Pendente',
        dueDate: {
          lt: today, // lt = less than (menor que hoje)
        },
        loan: {
          userId: user.id,
        },
      },
      include: {
        loan: {
          select: {
            title: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    if (overdueInstallments.length === 0) {
      return NextResponse.json({ message: 'Nenhuma parcela em atraso encontrada.' }, { status: 404 });
    }

    // A resposta agora será um array com todas as parcelas encontradas
    return NextResponse.json(overdueInstallments, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar parcelas atrasadas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}