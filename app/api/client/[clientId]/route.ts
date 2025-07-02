import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
  try {
    const { clientId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!clientId || !uniqueCode) {
      return NextResponse.json({ message: 'Client ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId, userId: user.id },
    });

    if (!client) {
      return NextResponse.json({ message: 'Client not found or does not belong to this user' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { clientId: string } }) {
  try {
    const { clientId } = params;
    const { uniqueCode, name, cpf, whatsapp, address, photoUrl, city, state, observations } = await request.json();

    if (!uniqueCode) {
      return NextResponse.json({ message: 'Unique code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId, userId: user.id },
      data: {
        name: name || undefined,
        cpf: cpf || undefined,
        whatsapp: whatsapp || undefined,
        address: address || undefined,
        photoUrl: photoUrl || undefined,
        city: city || undefined,
        state: state || undefined,
        observations: observations || undefined,
      },
    });

    return NextResponse.json(updatedClient, { status: 200 });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { clientId: string } }) {
  try {
    const { clientId } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    if (!clientId || !uniqueCode) {
      return NextResponse.json({ message: 'Client ID and unique code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { uniqueCode } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid unique code' }, { status: 401 });
    }

    await prisma.client.delete({
      where: { id: clientId, userId: user.id },
    });

    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
