import { NextResponse } from 'next/server';
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