import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Manipulador para o webhook da Evolution API.
 * Esta rota espera receber um POST request com um corpo em JSON, que pode ser um objeto único ou um array de objetos.
 */
export async function POST(req: Request) {
  try {
    // Extrai o corpo da requisição em formato JSON.
    const requestBody = await req.json();

    // Log para depuração: imprime o corpo inteiro do webhook no console do servidor.
    console.log('Webhook da Evolution API recebido:', JSON.stringify(requestBody, null, 2));

    // Garante que estamos trabalhando com um array de eventos, mesmo que o webhook envie um único objeto.
    const events = Array.isArray(requestBody) ? requestBody : [requestBody];

    // Itera sobre cada evento recebido.
    for (const body of events) {
      // Verifica se é um evento de nova mensagem e se os dados necessários existem.
      if (body.event === 'messages.upsert' && body.data?.key && body.data?.message) {
        const { key, message } = body.data;
        const sender = key.remoteJid; // JID do chat (usuário ou grupo)
        const messageContent = message.conversation || message.extendedTextMessage?.text || '';
        const fromMe = key.fromMe; // true se a mensagem foi enviada pelo bot, false caso contrário

        // Verifica se é o comando /criar_cliente
        if (messageContent.startsWith('/criar_cliente')) {
          console.log(`Comando /criar_cliente detectado de ${sender}. Acionando webhook do n8n AI.`);
          
          // Aciona o webhook do n8n para o agente de IA
          try {
            await fetch('https://n8n-n8n.qqfurw.easypanel.host/webhook/receber-mensagem', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                command: '/criar_cliente',
                serverUrl: body.server_url,
                sender: sender,
              }),
            });
            console.log('Webhook do n8n AI acionado com sucesso.');
          } catch (fetchError) {
            console.error('Erro ao acionar o webhook do n8n AI:', fetchError);
          }
          // Não salva o comando no banco de dados como uma mensagem normal
          continue; 
        }

        // Salva a mensagem no banco de dados se houver conteúdo.
        if (sender && messageContent) {
          await prisma.message.create({
            data: {
              sender: sender,
              content: messageContent,
              fromMe: fromMe,
              rawPayload: body, // Salva o payload completo para referência
            },
          });
          console.log(`Mensagem de ${sender} (fromMe: ${fromMe}) salva no banco de dados.`);
        }
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
