import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    // Para segurança, podemos adicionar uma chave de API secreta que o n8n deverá enviar
    const apiKey = request.headers.get('X-API-KEY');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ message: 'Acesso não autorizado' }, { status: 401 });
    }

    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);

    const installmentsToNotify = await prisma.installment.findMany({
      where: {
        status: 'Pendente', // Apenas notifica parcelas pendentes
        OR: [
          {
            // Parcelas que vencem HOJE
            dueDate: {
              gte: startOfDay(today),
              lte: endOfDay(today),
            },
          },
          {
            // Parcelas que vencem DAQUI A 7 DIAS
            dueDate: {
              gte: startOfDay(sevenDaysFromNow),
              lte: endOfDay(sevenDaysFromNow),
            },
          },
        ],
      },
      include: {
        loan: {
          include: {
            client: { // Inclui os dados do cliente (para pegar o WhatsApp)
              select: {
                name: true,
                whatsapp: true,
              },
            },
            user: { // Inclui os dados do credor (para pegar a chave PIX)
              select: {
                pixKey: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(installmentsToNotify, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar parcelas a vencer:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erro interno ao processar a solicitação.' }, { status: 500 });
  }
}