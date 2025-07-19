import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { cpf: string } }) {
  try {
    const { cpf } = params;
    const { searchParams } = new URL(request.url);
    const uniqueCode = searchParams.get('uniqueCode');

    // 1. Validação dos parâmetros de entrada
    if (!cpf || !uniqueCode) {
      return NextResponse.json({ message: 'CPF do cliente e seu código único são obrigatórios' }, { status: 400 });
    }

    // 2. Autenticação do credor
    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido' }, { status: 401 });
    }

    // 3. Busca das parcelas em uma única consulta otimizada
    const installments = await prisma.installment.findMany({
      where: {
        // Navega pelo relacionamento: Parcela -> Empréstimo -> Cliente
        loan: {
          client: {
            cpf: cpf,
            userId: user.id, // Garante que o cliente pertence ao credor
          },
        },
        // Filtra apenas as parcelas que estão em aberto
        OR: [
          { status: 'Pendente' },
          { status: 'Atrasado' },
        ],
      },
      // Inclui alguns dados do empréstimo para dar contexto
      include: {
        loan: {
          select: {
            title: true,
          }
        }
      },
      // Ordena pela data de vencimento mais próxima
      orderBy: {
        dueDate: 'asc',
      },
    });

    // 4. Resposta
    if (installments.length === 0) {
      // É importante retornar 404 para o n8n saber que não encontrou nada
      return NextResponse.json({ message: 'Nenhuma parcela em aberto encontrada para este cliente.' }, { status: 404 });
    }

    return NextResponse.json(installments, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar parcelas do cliente por CPF:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Erro interno do servidor.', errorDetails: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erro interno desconhecido ao processar a solicitação.' }, { status: 500 });
  }
}