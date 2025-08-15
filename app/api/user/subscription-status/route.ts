import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Esta função será chamada pelo frontend para verificar o status da assinatura
export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Token de autenticação não encontrado.' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json({ message: 'Payload do token inválido.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ subscriptionStatus: user.subscriptionStatus }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    if (error instanceof Error && (error.name === 'JWTExpired' || error.name === 'JWSInvalidToken')) {
        return NextResponse.json({ message: 'Token inválido ou expirado.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}