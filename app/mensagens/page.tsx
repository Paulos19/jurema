import prisma from '@/lib/prisma';
import { format } from 'date-fns';

// Força a página a ser renderizada dinamicamente para sempre buscar os dados mais recentes.
export const dynamic = 'force-dynamic';

async function getMessages() {
  const messages = await prisma.message.findMany({
    orderBy: {
      receivedAt: 'desc',
    },
  });
  return messages;
}

export default async function MensagensPage() {
  const messages = await getMessages();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Mensagens Recebidas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Uma lista de todas as mensagens recebidas através do WhatsApp.
          </p>
        </div>
      </div>

      <div className="-mx-4 mt-8 sm:-mx-0">
        <ul role="list" className="divide-y divide-gray-200">
          {messages.map((message) => (
            <li key={message.id} className="relative flex items-center space-x-4 px-4 py-4 sm:px-0">
              <div className="min-w-0 flex-auto">
                <div className="flex items-center gap-x-3">
                  <h2 className="min-w-0 text-sm font-semibold leading-6 text-gray-800">
                    {message.sender}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {message.content}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                {format(new Date(message.receivedAt), "dd/MM/yyyy 'às' HH:mm")}
              </div>
            </li>
          ))}
        </ul>

        {messages.length === 0 && (
            <p className='text-center text-gray-500 mt-8'>Nenhuma mensagem recebida ainda.</p>
        )}
      </div>
    </div>
  );
}
