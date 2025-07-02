import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { uniqueCode: string } }) {
  try {
    const { uniqueCode } = params;

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { uniqueCode },
      select: { // Select specific fields to avoid exposing sensitive data like password
        id: true,
        email: true,
        cpf: true,
        whatsapp: true,
        pixKey: true,
        city: true,
        state: true,
        createdAt: true,
        updatedAt: true,
        uniqueCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
