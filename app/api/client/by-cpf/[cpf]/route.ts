import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Rota para buscar um cliente pelo CPF
export async function GET(request: Request, { params }: { params: { cpf: string } }) {
  try {
    const { cpf } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!cpf || !uniqueCode) {
      return NextResponse.json({ message: 'CPF e unique code são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Código único inválido' }, { status: 401 });
    }

    // Busca o cliente que tem o CPF informado e pertence ao usuário (credor)
    const client = await prisma.client.findFirst({
      where: { 
        cpf: cpf,
        userId: user.id 
      },
    });

    if (!client) {
      return NextResponse.json({ message: 'Cliente não encontrado com este CPF ou não pertence a este usuário' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar cliente por CPF:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}