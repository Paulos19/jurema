// paulos19/jurema/jurema-1fae97708a9ea1fb21a85332f666f016246eb9e6/app/api/payment/check-status/route.ts
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

    // 1. Procura por um evento de pagamento bem-sucedido na tabela de webhooks
    const paidEvent = await prisma.webhookEvent.findFirst({
      where: {
        // Verifica eventos de pagamento de PIX ou Fatura
        eventType: { in: ['pix.paid', 'billing.paid'] },
        // Busca o externalId dentro do objeto JSON do payload
        payload: {
          path: ['data', 'metadata', 'externalId'],
          equals: externalId,
        },
      },
    });

    // 2. Se o evento de pagamento for encontrado, ativa a assinatura
    if (paidEvent) {
      const payload = paidEvent.payload as any;
      const metadata = payload?.data?.metadata;
      const customerId = payload?.data?.customer?.id;

      if (metadata?.userId && metadata?.plan) {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });

        // 3. Garante que o usuário existe e a assinatura ainda está como FREE_TRIAL
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
          
          // 4. ATIVA A ASSINATURA DO USUÁRIO
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: newSubscriptionStatus,
              subscriptionDueDate: newSubscriptionDueDate,
              abacatepayCustomerId: customerId,
            },
          });

          console.log(`Assinatura do usuário ${user.id} ativada via polling para ${newSubscriptionStatus}`);
          // 5. Retorna o status de sucesso para o frontend
          return NextResponse.json({ status: 'paid' });
        } else if (user) {
          // Se o usuário já tem outro status, significa que já foi ativado.
          return NextResponse.json({ status: 'paid' });
        }
      }
    }

    // Se nenhum evento de pagamento for encontrado, informa ao frontend que o pagamento está pendente
    return NextResponse.json({ status: 'pending' });

  } catch (error) {
    console.error('Erro ao verificar status do pagamento via polling:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}