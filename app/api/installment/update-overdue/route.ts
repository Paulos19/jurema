// app/api/installments/update-overdue/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { differenceInDays, startOfDay } from 'date-fns';

export async function POST(request: Request) {
  // 1. Segurança: Protege o endpoint com uma chave secreta
  const apiKey = request.headers.get('X-API-KEY');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ message: 'Acesso não autorizado' }, { status: 401 });
  }

  try {
    const today = startOfDay(new Date());

    // 2. Encontra todas as parcelas que estão pendentes e já venceram
    const installmentsToUpdate = await prisma.installment.findMany({
      where: {
        status: 'Pendente',
        dueDate: {
          lt: today, // lt = less than (menor que hoje)
        },
      },
      include: {
        loan: true, // Inclui o empréstimo para obter o valor da multa diária
      },
    });

    if (installmentsToUpdate.length === 0) {
      return NextResponse.json({ message: 'Nenhuma parcela pendente encontrada para atualização.' }, { status: 200 });
    }

    let updatedCount = 0;

    // 3. Itera sobre cada parcela atrasada para calcular e aplicar a multa
    for (const installment of installmentsToUpdate) {
      // Verifica se o empréstimo tem um valor de multa diária configurado
      if (installment.loan.dailyFineValue && installment.loan.dailyFineValue.gt(0)) {
        
        // Calcula o número de dias em atraso
        const daysLate = differenceInDays(today, installment.dueDate);

        // Calcula o valor total da multa
        const totalFine = installment.loan.dailyFineValue.times(daysLate);

        // Atualiza a parcela no banco de dados
        await prisma.installment.update({
          where: { id: installment.id },
          data: {
            status: 'Atrasado',
            daysLate: daysLate,
            totalFine: totalFine,
            // Opcional: Adiciona a multa ao valor devido da parcela
            // dueValue: installment.dueValue.plus(totalFine) 
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: 'Verificação de multas concluída com sucesso.',
      updatedCount: updatedCount,
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar multas por atraso:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}