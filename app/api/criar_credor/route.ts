import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Extrai todos os campos do corpo da requisição, incluindo os novos da Evolution API
    const { 
      masterKey, 
      name, // Novo campo
      email, 
      cpf, 
      password, 
      whatsapp, 
      pixKey, 
      city, 
      state,
      evoServerUrl, // Novo campo
      evoInstance,  // Novo campo
      evoApiKey     // Novo campo
    } = await request.json();

    // Valida a chave mestra a partir das variáveis de ambiente
    const CHAVE_MESTRA_VALIDA = process.env.CHAVE_MESTRA;
    if (masterKey !== CHAVE_MESTRA_VALIDA) {
      return NextResponse.json({ message: 'Token inválido.' }, { status: 401 });
    }

    // Validação dos campos obrigatórios
    if (!email || !cpf || !password || !whatsapp || !pixKey || !city || !state) {
      return NextResponse.json({ message: 'Todos os campos, exceto as credenciais da Evolution, são obrigatórios.' }, { status: 400 });
    }

    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    // Função para gerar um código único e legível
    const generateUniqueCode = (length: number = 8) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    // Garante que o código gerado seja realmente único no banco de dados
    let uniqueCode;
    let codeExists = true;
    while (codeExists) {
      uniqueCode = generateUniqueCode();
      codeExists = !!(await prisma.user.findUnique({ where: { uniqueCode } }));
    }

    // Cria o novo usuário no banco de dados com todos os campos
    const user = await prisma.user.create({
      data: {
        name,
        email,
        cpf,
        password: hashedPassword,
        whatsapp,
        pixKey,
        city,
        state,
        uniqueCode,
        // Salva os novos campos da Evolution API (serão null se não forem fornecidos)
        evoServerUrl,
        evoInstance,
        evoApiKey,
      },
    });

    // Remove a senha do objeto de resposta por segurança
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}