import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { installmentId: string } }) {
  try {
    const { installmentId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!installmentId || !uniqueCode) {
      return NextResponse.json({ message: 'Installment ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { loan: { select: { userId: true } } }, // Include loan to check user ownership
    });

    if (!installment || installment.loan.userId !== user.id) {
      return NextResponse.json({ message: 'Installment not found or does not belong to this user' }, { status: 404 });
    }

    return NextResponse.json(installment, { status: 200 });
  } catch (error) {
    console.error('Error fetching installment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { installmentId: string } }) {
  try {
    const { installmentId } = params;
    const { uniqueCode, dueValue, paidValue, status, dueDate, daysLate, totalFine } = await request.json();

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const existingInstallment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { loan: { select: { userId: true } } },
    });

    if (!existingInstallment || existingInstallment.loan.userId !== user.id) {
      return NextResponse.json({ message: 'Installment not found or does not belong to this user' }, { status: 404 });
    }

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        dueValue: dueValue ? parseFloat(dueValue) : undefined,
        paidValue: paidValue ? parseFloat(paidValue) : undefined,
        status: status || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        daysLate: daysLate || undefined,
        totalFine: totalFine ? parseFloat(totalFine) : undefined,
      },
    });

    return NextResponse.json(updatedInstallment, { status: 200 });
  } catch (error) {
    console.error('Error updating installment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { installmentId: string } }) {
  try {
    const { installmentId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!installmentId || !uniqueCode) {
      return NextResponse.json({ message: 'Installment ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const existingInstallment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { loan: { select: { userId: true } } },
    });

    if (!existingInstallment || existingInstallment.loan.userId !== user.id) {
      return NextResponse.json({ message: 'Installment not found or does not belong to this user' }, { status: 404 });
    }

    await prisma.installment.delete({
      where: { id: installmentId },
    });

    return NextResponse.json({ message: 'Installment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting installment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
