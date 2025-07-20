// app/api/loan/by-client-cpf/[cpf]/route.ts

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

    // Busca todos os empréstimos ativos para o cliente especificado
    const loans = await prisma.loan.findMany({
      where: {
        status: 'Aberto', // Retorna apenas empréstimos ativos
        userId: user.id,
        client: {
          cpf: cpf,
        },
      },
      select: {
        id: true,
        codeId: true,
        title: true,
        loanedValue: true,
      },
      orderBy: {
        createdAt: 'desc', // Mostra os mais recentes primeiro
      },
    });

    if (loans.length === 0) {
      return NextResponse.json({ message: 'Nenhum empréstimo ativo encontrado para este cliente.' }, { status: 404 });
    }

    return NextResponse.json(loans, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar empréstimos por CPF do cliente:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}