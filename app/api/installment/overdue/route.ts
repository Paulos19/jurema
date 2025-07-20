// app/api/installments/overdue/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    // --- LÓGICA ATUALIZADA AQUI ---
    // A busca agora é mais simples e direta: procura por todas as parcelas
    // que já foram marcadas com o status 'Atrasado'.
    const overdueInstallments = await prisma.installment.findMany({
      where: {
        status: 'Atrasado', // Procura diretamente pelo status 'Atrasado'
        loan: {
          userId: user.id, // Garante que as parcelas pertencem ao credor
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
        dueDate: 'asc', // Ordena pela data de vencimento mais antiga
      },
    });

    if (overdueInstallments.length === 0) {
      return NextResponse.json({ message: 'Nenhuma parcela em atraso encontrada.' }, { status: 404 });
    }

    return NextResponse.json(overdueInstallments, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar parcelas atrasadas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}