import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, cpf, password, whatsapp, pixKey, city, state } = await request.json();

    if (!email || !cpf || !password || !whatsapp || !pixKey || !city || !state) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique code for the user
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
        uniqueCode, // Add the generated unique code
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
