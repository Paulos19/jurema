import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request, { params }: { params: { transactionId: string } }) {
  try {
    const { transactionId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!transactionId || !uniqueCode) {
      return NextResponse.json({ message: 'Transaction ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { account: { select: { userId: true } } }, // Include account to check user ownership
    });

    if (!transaction || transaction.account.userId !== user.id) {
      return NextResponse.json({ message: 'Transaction not found or does not belong to this user' }, { status: 404 });
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}