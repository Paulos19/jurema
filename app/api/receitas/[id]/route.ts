// app/api/receitas/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Rota PUT: Atualiza o status de um pedido de receita específico.
 * Utilizada pelo admin para marcar um pedido como "CONCLUIDO".
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // Validação básica da entrada
    if (!status || (status !== 'PENDENTE' && status !== 'CONCLUIDO')) {
      return NextResponse.json(
        { message: 'O campo "status" é obrigatório e deve ser PENDENTE ou CONCLUIDO.' },
        { status: 400 }
      );
    }

    // Atualiza o pedido de receita no banco de dados usando o ID fornecido
    const updatedRequest = await prisma.recipeRequest.update({
      where: {
        id: id,
      },
      data: {
        status: status,
      },
    });

    return NextResponse.json(updatedRequest, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar o status do pedido de receita:', error);

    // Trata o erro específico do Prisma para quando o registro não é encontrado
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Pedido de receita não encontrado com o ID fornecido.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}