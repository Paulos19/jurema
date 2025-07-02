import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { uniqueCode, loanId, codeId, dueValue, dueDate } = await request.json();

    if (!uniqueCode || !loanId || !codeId || dueValue === undefined || !dueDate) {
      return NextResponse.json({ message: 'Missing required fields for installment creation' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const loan = await prisma.loan.findUnique({ where: { id: loanId, userId: user.id } });

    if (!loan) {
      return NextResponse.json({ message: 'Loan not found or does not belong to this user' }, { status: 404 });
    }

    const installment = await prisma.installment.create({
      data: {
        loanId,
        codeId,
        dueValue: parseFloat(dueValue),
        paidValue: 0, // Initially, paid value is 0
        status: 'Pendente', // Default status
        dueDate: new Date(dueDate),
      },
    });

    return NextResponse.json(installment, { status: 201 });
  } catch (error) {
    console.error('Error creating installment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
