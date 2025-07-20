// paulos19/jurema/jurema-51fda1c6f312ec4a8417251229c1b5b1b16a086f/app/api/client/[clientId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    // Usamos uma transação para garantir que todas as operações sejam bem-sucedidas ou nenhuma delas.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Encontra todos os empréstimos associados ao cliente que pertence a este credor.
      const loansToDelete = await tx.loan.findMany({
        where: {
          clientId: clientId,
          userId: user.id, // Garante que estamos a apagar dados do credor correto.
        },
        select: {
          id: true, // Seleciona apenas os IDs dos empréstimos.
        },
      });
      
      const loanIds = loansToDelete.map(loan => loan.id);

      // 2. Se existirem empréstimos, apaga todas as parcelas associadas a eles.
      if (loanIds.length > 0) {
        await tx.installment.deleteMany({
          where: {
            loanId: {
              in: loanIds,
            },
          },
        });

        // 3. Apaga os próprios empréstimos.
        await tx.loan.deleteMany({
          where: {
            id: {
              in: loanIds,
            },
          },
        });
      }

      // 4. Finalmente, apaga o cliente, agora que ele não tem mais dependências.
      const deletedClient = await tx.client.delete({
        where: {
          id: clientId,
          userId: user.id, // Adiciona uma verificação final de propriedade.
        },
      });

      return deletedClient;
    });

    return NextResponse.json({ message: `Cliente '${result.name}' e todos os seus dados foram excluídos com sucesso.` }, { status: 200 });
  
  } catch (error) {
    console.error('Error deleting client:', error);
    // Adiciona um tratamento de erro para o caso de o cliente não ser encontrado
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: 'Cliente não encontrado para exclusão.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}