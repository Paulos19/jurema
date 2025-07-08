import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { masterKey, email, cpf, password, whatsapp, pixKey, city, state } = await request.json();

    // ATENÇÃO: A chave mestra está hardcoded. Para produção, use variáveis de ambiente.
    const CHAVE_MESTRA_VALIDA = process.env.CHAVE_MESTRA;

    if (masterKey !== CHAVE_MESTRA_VALIDA) {
      return NextResponse.json({ message: 'Token inválido.' }, { status: 401 });
    }

    if (!email || !cpf || !password || !whatsapp || !pixKey || !city || !state) {
      return NextResponse.json({ message: 'Todos os campos, exceto o token, são obrigatórios.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const generateUniqueCode = (length: number = 8) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0987654321';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    let uniqueCode = generateUniqueCode();
    let codeExists = await prisma.user.findUnique({ where: { uniqueCode } });
    while (codeExists) {
      uniqueCode = generateUniqueCode();
      codeExists = await prisma.user.findUnique({ where: { uniqueCode } });
    }

    const user = await prisma.user.create({
      data: {
        email,
        cpf,
        password: hashedPassword,
        whatsapp,
        pixKey,
        city,
        state,
        uniqueCode,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}