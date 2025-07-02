import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { uniqueCode, name, balance, pixAssociated } = await request.json();

    if (!uniqueCode || !name || balance === undefined || !pixAssociated) {
      return NextResponse.json({ message: 'Missing required fields: uniqueCode, name, balance, pixAssociated' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        balance: parseFloat(balance),
        profit: 0, // Initial profit is 0
        pixAssociated,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
