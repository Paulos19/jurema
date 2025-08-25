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
        eventType: { in: ['pix.paid', 'billing.paid'] },
        OR: [
          { payload: { path: ['data', 'metadata', 'externalId'], equals: externalId } },
          { payload: { path: ['data', 'pixQrCode', 'metadata', 'externalId'], equals: externalId } },
        ],
      },
    });

    // Se o pagamento não for encontrado, informa o usuário para aguardar.
    if (!paidEvent) {
      return NextResponse.json({ status: 'pending', message: 'Pagamento ainda não confirmado. Por favor, aguarde alguns instantes e tente novamente.' }, { status: 404 });
    }

    const payload = paidEvent.payload as any;
    const metadata = payload?.data?.metadata ?? payload?.data?.pixQrCode?.metadata;
    const customerId = payload?.data?.customer?.id ?? payload?.data?.pixQrCode?.customer?.id;

    if (!metadata?.userId || !metadata?.plan) {
      return NextResponse.json({ status: 'error', message: 'Dados do pagamento inválidos.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: metadata.userId } });

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Usuário não encontrado.' }, { status: 404 });
    }
    
    // Se a assinatura já estiver ativa, apenas informa o usuário.
    if (user.subscriptionStatus !== 'FREE_TRIAL') {
        const planName = user.subscriptionStatus === 'ACTIVE_MONTHLY' ? 'Mensal' : 'Anual';
        return NextResponse.json({ status: 'already_active', message: `Sua assinatura do plano ${planName} já está ativa!`, plan: planName });
    }

    let newSubscriptionStatus: SubscriptionStatus;
    let newSubscriptionDueDate: Date;
    let planName: string;

    if (metadata.plan === 'monthly') {
      newSubscriptionStatus = 'ACTIVE_MONTHLY';
      newSubscriptionDueDate = addMonths(new Date(), 1);
      planName = 'Mensal';
    } else if (metadata.plan === 'annual') {
      newSubscriptionStatus = 'ACTIVE_ANNUAL';
      newSubscriptionDueDate = addYears(new Date(), 1);
      planName = 'Anual';
    } else {
      return NextResponse.json({ status: 'error', message: `Plano inválido: ${metadata.plan}` }, { status: 400 });
    }
    
    // Atualiza o status do usuário no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: newSubscriptionStatus,
        subscriptionDueDate: newSubscriptionDueDate,
        abacatepayCustomerId: customerId,
      },
    });
    
    console.log(`Assinatura do usuário ${user.id} ativada via comando /confirmado para ${newSubscriptionStatus}`);
    
    return NextResponse.json({ status: 'paid', message: `Pagamento confirmado!`, plan: planName });

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}