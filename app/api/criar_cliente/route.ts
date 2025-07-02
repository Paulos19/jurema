import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { uniqueCode, name, cpf, whatsapp, address, photoUrl, city, state, observations } = await request.json();

    if (!uniqueCode || !name || !whatsapp || !address || !city || !state) {
      return NextResponse.json({ message: 'Missing required fields: uniqueCode, name, whatsapp, address, city, state' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const userId = user.id;

    const client = await prisma.client.create({
      data: {
        userId,
        name,
        cpf,
        whatsapp,
        address,
        photoUrl,
        city,
        state,
        observations,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
