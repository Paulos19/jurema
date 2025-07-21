// app/api/clients/active/route.ts

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

    // Busca todos os clientes associados ao ID do usuário (credor)
    const activeClients = await prisma.client.findMany({
      where: {
        userId: user.id,
      },
      select: {
        name: true,
        cpf: true,
      },
      orderBy: {
        name: 'asc', // Ordena os clientes por nome
      },
    });

    if (activeClients.length === 0) {
      return NextResponse.json({ message: 'Nenhum cliente encontrado.' }, { status: 404 });
    }

    return NextResponse.json(activeClients, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar clientes ativos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}