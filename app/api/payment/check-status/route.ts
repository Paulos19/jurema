import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMonths, addYears } from 'date-fns';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { externalId } = await request.json();

    if (!externalId) {
      return NextResponse.json({ message: 'externalId é obrigatório.' }, { status: 400 });
    }

    // --- LÓGICA DE BUSCA CORRIGIDA ---
    // Como o `externalId` pode estar em caminhos diferentes dependendo do evento,
    // precisamos verificar múltiplos caminhos.
    const paidEvent = await prisma.webhookEvent.findFirst({
      where: {
        eventType: { in: ['pix.paid', 'billing.paid'] },
        // A consulta agora verifica um array de caminhos possíveis para o `externalId`
        OR: [
          {
            payload: {
              path: ['data', 'metadata', 'externalId'],
              equals: externalId,
            },
          },
          {
            payload: {
              path: ['data', 'pixQrCode', 'metadata', 'externalId'],
              equals: externalId,
            },
          },
        ],
      },
    });

    // O restante da lógica permanece o mesmo, pois uma vez que o evento é encontrado,
    // a extração dos dados continua válida.
    if (paidEvent) {
      const payload = paidEvent.payload as any;
      
      // Determina o caminho correto para os metadados com base no tipo de evento
      const metadata = payload?.data?.metadata ?? payload?.data?.pixQrCode?.metadata;
      const customerId = payload?.data?.customer?.id ?? payload?.data?.pixQrCode?.customer?.id;

      if (metadata?.userId && metadata?.plan) {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });

        if (user && user.subscriptionStatus === 'FREE_TRIAL') {
          let newSubscriptionStatus: SubscriptionStatus;
          let newSubscriptionDueDate: Date;

          if (metadata.plan === 'monthly') {
            newSubscriptionStatus = 'ACTIVE_MONTHLY';
            newSubscriptionDueDate = addMonths(new Date(), 1);
          } else if (metadata.plan === 'annual') {
            newSubscriptionStatus = 'ACTIVE_ANNUAL';
            newSubscriptionDueDate = addYears(new Date(), 1);
          } else {
            console.warn(`Plano inválido "${metadata.plan}" no polling para externalId: ${externalId}`);
            return NextResponse.json({ status: 'pending' });
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: newSubscriptionStatus,
              subscriptionDueDate: newSubscriptionDueDate,
              abacatepayCustomerId: customerId,
            },
          });

          console.log(`Assinatura do usuário ${user.id} ativada via polling para ${newSubscriptionStatus}`);
          return NextResponse.json({ status: 'paid' });
        } else if (user) {
          return NextResponse.json({ status: 'paid' });
        }
      }
    }

    return NextResponse.json({ status: 'pending' });

  } catch (error) {
    console.error('Erro ao verificar status do pagamento via polling:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}