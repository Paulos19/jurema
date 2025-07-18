import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { uniqueCode: string } }) {
  try {
    const { uniqueCode } = params;

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    // Busca o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { uniqueCode },
      // Seleciona explicitamente os campos que podem ser retornados publicamente
      select: {
        id: true,
        email: true,
        cpf: true,
        whatsapp: true,
        pixKey: true,
        city: true,
        state: true,
        createdAt: true,
        updatedAt: true,
        uniqueCode: true,
        // Inclui os campos da Evolution API na resposta
        evoServerUrl: true,
        evoInstance: true,
        evoApiKey: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { uniqueCode: string } }) {
  try {
    const { uniqueCode } = params;
    const { evoServerUrl, evoInstance, evoApiKey } = await request.json();

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    // Verifica se os dados a serem atualizados foram fornecidos
    if (!evoServerUrl || !evoInstance || !evoApiKey) {
      return NextResponse.json({ message: 'evoServerUrl, evoInstance, e evoApiKey são obrigatórios para a atualização.' }, { status: 400 });
    }

    // Validação básica da URL
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    if (evoServerUrl && !urlRegex.test(evoServerUrl)) {
      return NextResponse.json({ message: 'evoServerUrl deve ser uma URL válida.' }, { status: 400 });
    }

    // Atualiza o usuário no banco de dados onde o uniqueCode corresponde
    const updatedUser = await prisma.user.update({
      where: { uniqueCode },
      data: {
        evoServerUrl,
        evoInstance,
        evoApiKey,
      },
    });

    // Remove a senha do objeto de resposta por segurança
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Error updating user credentials:', error);
    // Adiciona um tratamento para o caso de o usuário não ser encontrado
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: 'Usuário não encontrado com o unique code fornecido.' }, { status: 404 });
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Trata erros de validação do Prisma
        console.error('Prisma validation error:', error);
        return NextResponse.json({ message: 'Erro de validação ao atualizar o usuário.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}