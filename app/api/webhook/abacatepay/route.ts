import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addMonths, addYears } from 'date-fns'
import { SubscriptionStatus } from '@prisma/client'

const webhookSecret = process.env.NEXT_PUBLIC_ABACATE_PAY_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('webhookSecret')

  if (secret !== webhookSecret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  try {
    const event = await req.json()

    // Log e salva o evento para auditoria
    console.log('Received webhook:', JSON.stringify(event, null, 2));
    await prisma.webhookEvent.create({
      data: {
        eventType: event.event,
        payload: event,
      },
    })

    // --- LÓGICA DE ATIVAÇÃO DA ASSINATURA ---
    if (event.event === 'pix.paid' || event.event === 'billing.paid') {
      const customerTaxId = event.data?.customer?.taxId;
      const metadata = event.data?.metadata;

      if (customerTaxId && metadata?.userId && metadata?.plan) {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });

        if (user) {
          const planType = metadata.plan;
          let newSubscriptionStatus: SubscriptionStatus;
          let newSubscriptionDueDate: Date;

          if (planType === 'monthly') {
            newSubscriptionStatus = 'ACTIVE_MONTHLY';
            newSubscriptionDueDate = addMonths(new Date(), 1);
          } else if (planType === 'annual') {
            newSubscriptionStatus = 'ACTIVE_ANNUAL';
            newSubscriptionDueDate = addYears(new Date(), 1);
          } else {
            console.error(`Plano inválido "${planType}" nos metadados do webhook.`);
            return NextResponse.json({ received: true, message: 'Plano inválido nos metadados.' });
          }

          // Atualiza o usuário no banco de dados, ativando a assinatura
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: newSubscriptionStatus,
              subscriptionDueDate: newSubscriptionDueDate,
              abacatepayCustomerId: event.data?.customer?.id,
            }
          });
          console.log(`Assinatura do usuário ${user.id} atualizada para ${newSubscriptionStatus}`);
        } else {
          console.error(`Webhook recebido para usuário desconhecido: ${metadata.userId}`);
        }
      } else {
        console.warn('Webhook de pagamento recebido sem os metadados necessários (userId, plan).');
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}