import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { uniqueCode, clientId, codeId, loanedValue, title, type, installmentsQuantity, recurrencePeriod, originalDueValue, dailyFineValue, loanDate, description } = await request.json();

    if (!uniqueCode || !clientId || !codeId || loanedValue === undefined || !title || !type || installmentsQuantity === undefined || !recurrencePeriod || originalDueValue === undefined || !loanDate) {
      return NextResponse.json({ message: 'Missing required fields for loan creation' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId, userId: user.id } });

    if (!client) {
      return NextResponse.json({ message: 'Client not found or does not belong to this user' }, { status: 404 });
    }

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        clientId,
        codeId,
        loanedValue: parseFloat(loanedValue),
        title,
        type,
        status: 'Aberto', // Default status
        installmentsQuantity,
        recurrencePeriod,
        loanBalance: parseFloat(loanedValue), // Initially, loan balance is the loaned value
        originalDueValue: parseFloat(originalDueValue),
        dailyFineValue: dailyFineValue ? parseFloat(dailyFineValue) : null,
        loanDate: new Date(loanDate),
        description,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
