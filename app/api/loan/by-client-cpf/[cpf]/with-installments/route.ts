// app/api/loan/by-client-cpf/[cpf]/with-installments/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    const loans = await prisma.loan.findMany({
      where: {
        status: 'Aberto',
        userId: user.id,
        client: {
          cpf: cpf,
        },
      },
      include: {
        // Inclui apenas as parcelas que ainda podem ser excluídas
        installments: {
          where: {
            OR: [
              { status: 'Pendente' },
              { status: 'Atrasado' },
            ],
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (loans.length === 0) {
      return NextResponse.json({ message: 'Nenhum empréstimo ativo com parcelas a serem excluídas foi encontrado para este cliente.' }, { status: 404 });
    }

    return NextResponse.json(loans, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar empréstimos com parcelas por CPF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}