import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define a estrutura esperada para cada parcela no array de entrada
interface InstallmentUpdate {
  id: string;
  dueValue: number;
}

export async function POST(request: Request) {
  try {
    // Extrai os dados do corpo da requisição
    const { uniqueCode, loanId, updatedInstallments } = await request.json();

    // Valida se todos os dados necessários foram recebidos
    if (!uniqueCode || !loanId || !Array.isArray(updatedInstallments) || updatedInstallments.length === 0) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes: uniqueCode, loanId, updatedInstallments' }, { status: 400 });
    }

    // Autentica o usuário (credor)
    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }

    // Utiliza uma transação do Prisma para garantir a integridade dos dados.
    // Ou todas as parcelas são atualizadas com sucesso, ou nenhuma é.
    const result = await prisma.$transaction(async (tx) => {
      // Primeiro, verifica se o empréstimo realmente pertence ao usuário que fez a requisição
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId: user.id },
      });

      // Se o empréstimo não for encontrado, lança um erro que cancelará a transação
      if (!loan) {
        throw new Error('Empréstimo não encontrado ou não pertence a este usuário.');
      }

      // Itera sobre cada parcela recebida no array e a atualiza no banco de dados
      for (const inst of updatedInstallments as InstallmentUpdate[]) {
        await tx.installment.update({
          where: { id: inst.id },
          data: { dueValue: new Prisma.Decimal(inst.dueValue) },
        });
      }

      return { message: 'Plano de parcelamento atualizado com sucesso.' };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar plano de parcelamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno.';
    return NextResponse.json({ message: 'Erro ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}
