import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Manipulador para o webhook da Evolution API.
 * Esta rota espera receber um POST request com um corpo em JSON.
 */
export async function POST(req: Request) {
  try {
    // Extrai o corpo da requisição em formato JSON.
    const body = await req.json();

    // Log para depuração: imprime o corpo inteiro do webhook no console do servidor.
    console.log('Webhook da Evolution API recebido:', JSON.stringify(body, null, 2));

    // Verifica se é um evento de nova mensagem e se não foi enviada por nós.
    if (body.event === 'messages.upsert' && body.data?.key?.fromMe === false) {
      const sender = body.data.key.remoteJid;
      const messageContent = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text || '';

      // Salva a mensagem no banco de dados se houver conteúdo.
      if (sender && messageContent) {
        await prisma.message.create({
          data: {
            sender: sender,
            content: messageContent,
            rawPayload: body, // Salva o payload completo para referência
          },
        });
        console.log(`Mensagem de ${sender} salva no banco de dados.`);
      }
    }

    // Responde à Evolution API que o webhook foi recebido com sucesso.
    return NextResponse.json({ message: 'Webhook recebido com sucesso!' }, { status: 200 });

  } catch (error) {
    // Em caso de erro (ex: JSON inválido), loga o erro.
    console.error('Erro ao processar o webhook da Evolution API:', error);

    // Responde com um erro do servidor.
    return NextResponse.json({ message: 'Erro interno ao processar o webhook.' }, { status: 500 });
  }
}
