import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    const client = await prisma.client.findFirst({
      where: { 
        cpf: cpf,
        userId: user.id 
      },
    });

    if (!client) {
      // Retorna 404 se o cliente não for encontrado, o que é mais específico que 500
      return NextResponse.json({ message: 'Cliente não encontrado com este CPF ou não pertence a este usuário' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });

  } catch (error) {
    // --- CORREÇÃO APLICADA AQUI ---
    // Loga o erro completo no console do seu servidor (Vercel, etc.)
    console.error('ERRO DETALHADO AO BUSCAR CLIENTE POR CPF:', error);

    // Retorna uma mensagem de erro mais útil para a depuração no n8n
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Erro interno do servidor.', errorDetails: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Erro interno desconhecido ao processar a solicitação.' }, { status: 500 });
  }
}