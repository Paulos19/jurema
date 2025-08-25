import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePixQRCode } from '@/app/actions/abacate-pay';

export async function POST(request: Request) {
  try {
    const { uniqueCode, planType } = await request.json();

    // Validação dos dados de entrada
    if (!uniqueCode || !planType || (planType !== 'monthly' && planType !== 'annual')) {
      return NextResponse.json({ message: 'uniqueCode e planType (monthly ou annual) são obrigatórios.' }, { status: 400 });
    }

    // Busca o usuário pelo uniqueCode para obter o ID
    const user = await prisma.user.findUnique({
      where: { uniqueCode },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Chama a Server Action existente para gerar o PIX
    const pixData = await generatePixQRCode(planType, user.id);

    if (pixData.error) {
      throw new Error(pixData.error);
    }

    return NextResponse.json(pixData, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar PIX via API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}