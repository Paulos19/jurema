import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { uniqueCode, accountId, title, value, type, description, category, date } = await request.json();

    if (!uniqueCode || !accountId || !title || value === undefined || !type || !category || !date) {
      return NextResponse.json({ message: 'Missing required fields for transaction creation' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId, userId: user.id } });

    if (!account) {
      return NextResponse.json({ message: 'Account not found or does not belong to this user' }, { status: 404 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        accountId,
        title,
        value: parseFloat(value),
        type,
        description,
        category,
        date: new Date(date),
      },
    });

    // Update account balance
    let newBalance = account.balance;
    if (type === 'Entrada') {
      newBalance += parseFloat(value);
    } else if (type === 'Saída') {
      newBalance -= parseFloat(value);
    }
    // For 'Transferencia', the logic would be more complex, involving two accounts.
    // For simplicity, we'll only handle Entrada/Saída for now.

    await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
