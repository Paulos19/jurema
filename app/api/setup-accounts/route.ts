import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Função para criar um ID de conta mais amigável
const createAccountId = (name: string, count: number) => {
  const cleanName = name.trim().toUpperCase().substring(0, 4);
  return `${cleanName}${count}`;
};

export async function POST(request: Request) {
  try {
    const { uniqueCode, accounts } = await request.json();

    // Validações
    if (!uniqueCode || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ message: 'Código único e uma lista de contas são obrigatórios.' }, { status: 400 });
    }

    // Autentica o credor
    const user = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!user) {
      return NextResponse.json({ message: 'Código único inválido.' }, { status: 401 });
    }

    const createdAccounts: any[] = [];

    // Usamos uma transação para garantir que tudo seja salvo ou nada seja.
    await prisma.$transaction(async (tx) => {
      // Pega o número de contas que o usuário já tem para gerar IDs sequenciais
      let existingAccountCount = await tx.account.count({ where: { userId: user.id } });

      for (const accountName of accounts) {
        if (typeof accountName !== 'string' || accountName.trim() === '') {
          continue; // Pula nomes de conta vazios
        }

        // Verifica se uma conta com o mesmo nome já existe para este usuário
        const existingAccount = await tx.account.findFirst({
          where: {
            userId: user.id,
            name: {
              equals: accountName.trim(),
              mode: 'insensitive', // Não diferencia maiúsculas/minúsculas
            },
          },
        });

        if (existingAccount) {
          // Se a conta já existe, apenas a adiciona à lista de retorno sem criar uma nova
          createdAccounts.push(existingAccount);
        } else {
          // Se não existe, cria uma nova
          existingAccountCount++;
          const newAccount = await tx.account.create({
            data: {
              id: createAccountId(accountName, existingAccountCount), // Gera um ID amigável como "CAIXA1"
              userId: user.id,
              name: accountName.trim(),
              balance: 0, // Saldo inicial
              profit: 0,
              pixAssociated: user.pixKey, // Associa a chave PIX principal do usuário
            },
          });
          createdAccounts.push(newAccount);
        }
      }
    });

    return NextResponse.json(createdAccounts, { status: 201 });

  } catch (error) {
    console.error('Erro ao configurar contas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido.';
    return NextResponse.json({ message: 'Erro interno ao processar a solicitação.', error: errorMessage }, { status: 500 });
  }
}