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

    // Pega a data de hoje, no início do dia, para a comparação.
    const today = startOfDay(new Date());

    const overdueInstallments = await prisma.installment.findMany({
      where: {
        // A CONDIÇÃO CORRIGIDA ESTÁ AQUI:
        // A parcela deve estar 'Pendente' E a data de vencimento deve ser anterior a hoje.
        status: 'Pendente',
        dueDate: {
          lt: today, // 'lt' significa "less than" (menor que)
        },
        // Garante que estamos a buscar apenas as parcelas deste credor.
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
      // Retorna 404 para o n8n saber que a busca foi bem-sucedida, mas não encontrou resultados.
      return NextResponse.json({ message: 'Nenhuma parcela em atraso encontrada.' }, { status: 404 });
    }

    return NextResponse.json(overdueInstallments, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar parcelas atrasadas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}