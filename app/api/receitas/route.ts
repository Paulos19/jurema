// app/api/receitas/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Rota GET: Para o administrador listar todos os pedidos de receita
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Código único do credor é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido' }, { status: 401 });
    }

    const recipeRequests = await prisma.recipeRequest.findMany({
      where: {
        userId: user.id,
        status: 'PENDENTE', // Lista apenas os pedidos pendentes
      },
      orderBy: {
        solicitadoEm: 'asc', // Mostra os mais antigos primeiro
      },
    });

    if (recipeRequests.length === 0) {
      // Retorna um array vazio com status 200, que é mais comum para listas vazias
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(recipeRequests, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar pedidos de receita:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// Rota POST: Para o N8N cadastrar um novo pedido de receita
export async function POST(request: Request) {
  try {
    const { uniqueCode, rawData, jsonData, solicitadoPor } = await request.json();

    if (!uniqueCode || !rawData || !solicitadoPor) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes: uniqueCode, rawData, solicitadoPor' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido' }, { status: 401 });
    }

    const newRequest = await prisma.recipeRequest.create({
      data: {
        userId: user.id,
        rawData: rawData,
        jsonData: jsonData || {}, // Garante que o campo json não seja nulo
        solicitadoPor: solicitadoPor,
        status: 'PENDENTE',
      },
    });

    return NextResponse.json(newRequest, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar pedido de receita:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}