// app/api/receitas/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Rota GET: Lista todos os pedidos de receita pendentes.
// A segurança é garantida pelo N8N, que só chama esta rota se o remetente for o admin.
export async function GET(request: Request) {
  try {
    const recipeRequests = await prisma.recipeRequest.findMany({
      where: {
        status: 'PENDENTE',
      },
      orderBy: {
        solicitadoEm: 'asc',
      },
    });

    return NextResponse.json(recipeRequests, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar pedidos de receita:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// Rota POST: Cadastra um novo pedido de receita.
// Não precisa de uniqueCode.
export async function POST(request: Request) {
  try {
    const { rawData, jsonData, solicitadoPor } = await request.json();

    if (!rawData || !solicitadoPor) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes: rawData, solicitadoPor' }, { status: 400 });
    }

    const newRequest = await prisma.recipeRequest.create({
      data: {
        rawData: rawData,
        jsonData: jsonData || {},
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