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

    // Procura por um evento de pagamento bem-sucedido na tabela de webhooks
    const paidEvent = await prisma.webhookEvent.findFirst({
      where: {
        eventType: 'pix.paid', // ou 'billing.paid' se aplicável
        payload: {
          path: ['data', 'metadata', 'externalId'],
          equals: externalId,
        },
      },
    });

    if (paidEvent) {
      // Se o evento de pagamento for encontrado, extraímos os dados para ativar a assinatura
      const payload = paidEvent.payload as any;
      const metadata = payload?.data?.metadata;
      const customerId = payload?.data?.customer?.id;

      if (metadata?.userId && metadata?.plan) {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });

        // Verifica se o usuário existe e se a assinatura ainda está pendente
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
            // Se o plano não for reconhecido, não faz nada
            return NextResponse.json({ status: 'pending' });
          }
          
          // ATIVA A ASSINATURA DO USUÁRIO
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: newSubscriptionStatus,
              subscriptionDueDate: newSubscriptionDueDate,
              abacatepayCustomerId: customerId,
            },
          });

          console.log(`Assinatura do usuário ${user.id} ativada via polling para ${newSubscriptionStatus}`);
          // Retorna o status de sucesso para o frontend
          return NextResponse.json({ status: 'paid' });
        }
      }
    }

    // Se nenhum evento de pagamento for encontrado, informa ao frontend que o pagamento está pendente
    return NextResponse.json({ status: 'pending' });

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}