import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define o tipo esperado para cada parcela no array
interface InstallmentInput {
  dueValue: number;
  dueDate: string;
}

// Define a estrutura do corpo da requisição
interface EmprestimoCompletoInput {
  uniqueCode: string; // O uniqueCode vem no nível raiz do JSON
  loanData: Omit<Prisma.LoanUncheckedCreateInput, 'userId'>; // loanData tem os dados do empréstimo, exceto userId
  installments: InstallmentInput[];
}

export async function POST(request: Request) {
  try {
    const { 
      uniqueCode, 
      loanData, 
      installments 
    }: EmprestimoCompletoInput = await request.json();

    const { clientId } = loanData;

    if (!uniqueCode || !clientId || !installments || installments.length === 0) {
      return NextResponse.json({ message: 'Dados insuficientes para criar o empréstimo completo.' }, { status: 400 });
    }

    // Valida o usuário (credor) usando o uniqueCode
    const user = await prisma.user.findUnique({ where: { uniqueCode: uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }
    
    // Executa a criação do empréstimo e de suas parcelas dentro de uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria o Empréstimo, adicionando o userId validado
      const newLoan = await tx.loan.create({
        data: {
          ...loanData,
          userId: user.id, // Adiciona o ID do usuário aos dados do empréstimo
        },
      });

      // 2. Prepara os dados das Parcelas com o ID do novo empréstimo
      const installmentsData = installments.map((inst, index) => ({
        loanId: newLoan.id,
        codeId: `P-${newLoan.id.slice(0, 4)}-${index + 1}`.toUpperCase(),
        dueValue: new Prisma.Decimal(inst.dueValue),
        dueDate: new Date(inst.dueDate),
        status: 'Pendente' as const, // Assegura que o tipo está correto
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
    // Em caso de erro, forneça uma mensagem mais detalhada se possível
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json({ message: `Erro de banco de dados: ${error.code}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erro interno ao processar a solicitação.' }, { status: 500 });
  }
}