import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { uniqueCode, installmentId, amountPaid, accountId, paymentDate, description, quitLoan } = await request.json();

    if (!uniqueCode || !installmentId || amountPaid === undefined || !accountId || !paymentDate) {
      return NextResponse.json({ message: 'Missing required fields for payment registration' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { loan: { include: { client: true } } },
    });

    if (!installment || installment.loan.userId !== user.id) {
      return NextResponse.json({ message: 'Installment not found or does not belong to this user' }, { status: 404 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId, userId: user.id } });

    if (!account) {
      return NextResponse.json({ message: 'Account not found or does not belong to this user' }, { status: 404 });
    }

    const newPaidValue = installment.paidValue.toNumber() + parseFloat(amountPaid);
    let newInstallmentStatus = installment.status;

    if (newPaidValue >= installment.dueValue.toNumber()) {
      newInstallmentStatus = 'Pago';
    }

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        paidValue: newPaidValue,
        status: newInstallmentStatus,
      },
    });

    // Update loan balance
    const updatedLoan = await prisma.loan.update({
      where: { id: installment.loanId },
      data: {
        loanBalance: installment.loan.loanBalance.toNumber() - parseFloat(amountPaid),
        status: quitLoan ? 'Quitado' : installment.loan.status, // Set loan to 'Quitado' if quitLoan is true
      },
    });

    // Create a transaction record
    await prisma.transaction.create({
      data: {
        accountId,
        title: `Pagamento Parcela ${installment.codeId} - ${installment.loan.title}`,
        value: parseFloat(amountPaid),
        type: 'Entrada',
        description: description || `Pagamento recebido para parcela ${installment.codeId}`,
        category: 'Pagamento',
        date: new Date(paymentDate),
      },
    });

    // Update account balance
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: account.balance.toNumber() + parseFloat(amountPaid) },
    });

    return NextResponse.json({ updatedInstallment, updatedLoan }, { status: 200 });
  } catch (error) {
    console.error('Error registering payment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
