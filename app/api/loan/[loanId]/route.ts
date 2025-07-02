import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!loanId || !uniqueCode) {
      return NextResponse.json({ message: 'Loan ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId, userId: user.id },
      include: { installments: true }, // Include installments related to the loan
    });

    if (!loan) {
      return NextResponse.json({ message: 'Loan not found or does not belong to this user' }, { status: 404 });
    }

    return NextResponse.json(loan, { status: 200 });
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const { uniqueCode, loanedValue, title, type, status, installmentsQuantity, recurrencePeriod, originalDueValue, dailyFineValue, loanDate, description } = await request.json();

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId, userId: user.id },
      data: {
        loanedValue: loanedValue ? parseFloat(loanedValue) : undefined,
        title: title || undefined,
        type: type || undefined,
        status: status || undefined,
        installmentsQuantity: installmentsQuantity || undefined,
        recurrencePeriod: recurrencePeriod || undefined,
        originalDueValue: originalDueValue ? parseFloat(originalDueValue) : undefined,
        dailyFineValue: dailyFineValue ? parseFloat(dailyFineValue) : undefined,
        loanDate: loanDate ? new Date(loanDate) : undefined,
        description: description || undefined,
      },
    });

    return NextResponse.json(updatedLoan, { status: 200 });
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { loanId: string } }) {
  try {
    const { loanId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!loanId || !uniqueCode) {
      return NextResponse.json({ message: 'Loan ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    await prisma.loan.delete({
      where: { id: loanId, userId: user.id },
    });

    return NextResponse.json({ message: 'Loan deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
