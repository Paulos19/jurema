import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, LoanType, RecurrencePeriod } from '@prisma/client'; // Importe os Enums

// --- FUNÇÕES DE VALIDAÇÃO ---
function isLoanType(value: string): value is LoanType {
  return Object.values(LoanType).includes(value as LoanType);
}

function isRecurrencePeriod(value: string): value is RecurrencePeriod {
  return Object.values(RecurrencePeriod).includes(value as RecurrencePeriod);
}
// ----------------------------

interface InstallmentInput {
  dueValue: number;
  dueDate: string;
}

// Interface para os dados do empréstimo recebidos no JSON
interface LoanDataInput {
  clientId: string;
  loanedValue: number;
  title: string;
  type: string;
  installmentsQuantity: number;
  recurrencePeriod: string;
  interestRate?: number;
  dailyFineValue?: number; // <-- NOVO CAMPO ADICIONADO
  loanDate: string;
  codeId: string;
}

interface EmprestimoCompletoInput {
  uniqueCode: string;
  loanData: LoanDataInput;
  installments: InstallmentInput[];
}

export async function POST(request: Request) {
  try {
    const { 
      uniqueCode, 
      loanData, 
      installments 
    }: EmprestimoCompletoInput = await request.json();

    if (!uniqueCode || !loanData || !installments || !loanData.codeId || installments.length === 0) {
      return NextResponse.json({ message: 'Dados insuficientes para criar o empréstimo completo, incluindo o codeId.' }, { status: 400 });
    }

    if (!isLoanType(loanData.type)) {
      return NextResponse.json({ message: `Tipo de empréstimo inválido: ${loanData.type}` }, { status: 400 });
    }
    if (!isRecurrencePeriod(loanData.recurrencePeriod)) {
      return NextResponse.json({ message: `Período de recorrência inválido: ${loanData.recurrencePeriod}` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode: uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          userId: user.id,
          clientId: loanData.clientId,
          title: loanData.title,
          status: 'Aberto',
          installmentsQuantity: loanData.installmentsQuantity,
          loanedValue: new Prisma.Decimal(loanData.loanedValue),
          interestRate: loanData.interestRate ? new Prisma.Decimal(loanData.interestRate) : null,
          loanDate: new Date(loanData.loanDate),
          loanBalance: new Prisma.Decimal(loanData.loanedValue),
          originalDueValue: new Prisma.Decimal(0),
          type: loanData.type as LoanType,
          recurrencePeriod: loanData.recurrencePeriod as RecurrencePeriod,
          codeId: loanData.codeId,
          // --- LÓGICA ATUALIZADA AQUI ---
          dailyFineValue: loanData.dailyFineValue ? new Prisma.Decimal(loanData.dailyFineValue) : null,
        },
      });

      const installmentsData = installments.map((inst, index) => ({
        loanId: newLoan.id,
        codeId: `P-${newLoan.codeId}-${index + 1}`.toUpperCase(),
        dueValue: new Prisma.Decimal(inst.dueValue),
        dueDate: new Date(inst.dueDate),
        status: 'Pendente' as const,
        paidValue: 0,
      }));

      await tx.installment.createMany({
        data: installmentsData,
      });

      return newLoan;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Erro detalhado ao criar empréstimo completo:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erro interno ao processar a solicitação.' }, { status: 500 });
  }
}