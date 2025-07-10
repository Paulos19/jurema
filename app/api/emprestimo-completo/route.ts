import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define o tipo esperado para cada parcela no array
interface InstallmentInput {
  dueValue: number;
  dueDate: string;
}

export async function POST(request: Request) {
  const { 
    loanData, 
    installments 
  }: { 
    loanData: Prisma.LoanUncheckedCreateInput, 
    installments: InstallmentInput[] 
  } = await request.json();

  const { uniqueCode, clientId } = loanData;

  if (!uniqueCode || !clientId || !installments || installments.length === 0) {
    return NextResponse.json({ message: 'Dados insuficientes para criar o empréstimo completo.' }, { status: 400 });
  }

  try {
    // Valida o usuário (credor)
    const user = await prisma.user.findUnique({ where: { uniqueCode: String(uniqueCode) } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }

    // Garante que o loanData.userId seja definido corretamente
    loanData.userId = user.id;

    // Remove o uniqueCode do objeto de dados do empréstimo para evitar erro no Prisma
    delete (loanData as { uniqueCode?: string }).uniqueCode;
    
    // Executa a criação do empréstimo e de suas parcelas dentro de uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria o Empréstimo
      const newLoan = await tx.loan.create({
        data: loanData,
      });

      // 2. Prepara os dados das Parcelas com o ID do novo empréstimo
      const installmentsData = installments.map((inst, index) => ({
        loanId: newLoan.id,
        codeId: `P-${newLoan.id.slice(0, 4)}-${index + 1}`.toUpperCase(),
        dueValue: new Prisma.Decimal(inst.dueValue),
        dueDate: new Date(inst.dueDate),
        status: 'Pendente',
        paidValue: 0,
      }));

      // 3. Cria todas as Parcelas de uma vez
      await tx.installment.createMany({
        data: installmentsData,
      });

      return newLoan;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar empréstimo completo:', error);
    return NextResponse.json({ message: 'Erro interno ao processar a solicitação.' }, { status: 500 });
  }
}