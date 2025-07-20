// app/api/installments/update-overdue/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { differenceInDays, startOfDay } from 'date-fns';

export async function POST(request: Request) {
  const apiKey = request.headers.get('X-API-KEY');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ message: 'Acesso não autorizado' }, { status: 401 });
  }

  try {
    const today = startOfDay(new Date());

    const installmentsToUpdate = await prisma.installment.findMany({
      where: {
        status: 'Pendente',
        dueDate: {
          lt: today,
        },
      },
      include: {
        loan: true,
      },
    });

    if (installmentsToUpdate.length === 0) {
      return NextResponse.json({ message: 'Nenhuma parcela pendente encontrada para atualização.' }, { status: 200 });
    }

    let updatedCount = 0;
    const updates = [];

    for (const installment of installmentsToUpdate) {
      if (installment.loan.dailyFineValue && installment.loan.dailyFineValue.gt(0)) {
        
        // --- INÍCIO DA LÓGICA ATUALIZADA ---

        // 1. Determina o valor base para o cálculo da multa.
        //    Usa o 'original_due_value' se já existir, senão usa o 'dueValue' atual.
        const originalValue = installment.originalDueValue ?? installment.dueValue;
        
        // 2. Calcula os dias em atraso e o valor total da multa.
        const daysLate = differenceInDays(today, installment.dueDate);
        const totalFine = installment.loan.dailyFineValue.times(daysLate);

        // 3. Calcula o novo valor devido (Valor Original + Multa Total).
        const newDueValue = originalValue.plus(totalFine);

        // 4. Prepara a operação de atualização para a transação.
        const updatePromise = prisma.installment.update({
          where: { id: installment.id },
          data: {
            // Guarda o valor original apenas na primeira vez que a multa é aplicada.
            originalDueValue: originalValue,
            status: 'Atrasado',
            daysLate: daysLate,
            totalFine: totalFine,
            dueValue: newDueValue, // O valor devido agora inclui a multa.
          },
        });
        updates.push(updatePromise);
        
        // --- FIM DA LÓGICA ATUALIZADA ---
        
        updatedCount++;
      }
    }

    // Executa todas as atualizações de uma só vez numa transação
    if (updates.length > 0) {
      await prisma.$transaction(updates);
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