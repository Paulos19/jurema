import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createSubscription } from './actions/abacate-pay';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export default async function Home() {
  let userId: string | null = null;

  try {
    const token = (await cookies()).get('authToken')?.value;
    if (token) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    }
  } catch (error) {
    console.error('Failed to verify token:', error);
    // If token is invalid, userId remains null, and the page will render accordingly
  }

  const handleSubscription = async (planType: 'monthly' | 'annual') => {
    'use server';
    if (userId) {
      await createSubscription(planType, userId);
    } else {
      // Handle case where user is not logged in, maybe redirect to login
      console.error('User not logged in to subscribe.');
      // You might want to redirect to the login page here
      // redirect('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Jurema: Sua Plataforma de Gestão Financeira
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Simplifique suas finanças, organize seus empréstimos e otimize seus ganhos.
        </p>
      </header>

      <section className="w-full max-w-6xl px-4 mb-12">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Recursos que Você Vai Amar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Gestão de Empréstimos</h3>
            <p className="text-gray-600">
              Controle total sobre seus empréstimos, clientes e parcelas.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Automação de Pagamentos</h3>
            <p className="text-gray-600">
              Integração com Abacate Pay para pagamentos e recebimentos facilitados.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Comunicação Inteligente</h3>
            <p className="text-gray-600">
              Integração com Evolution API para comunicação via WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-6xl px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Escolha o Plano Ideal para Você
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Plan Card */}
          <div className="bg-white p-8 rounded-lg shadow-xl border-2 border-indigo-500">
            <h3 className="text-3xl font-bold text-indigo-600 mb-4">Plano Mensal</h3>
            <p className="text-5xl font-extrabold text-gray-900 mb-6">
              R$ 97<span className="text-xl font-medium text-gray-600">/mês</span>
            </p>
            <ul className="text-gray-700 space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Todos os recursos do Jurema
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Suporte prioritário
              </li>
            </ul>
            <form action={handleSubscription.bind(null, 'monthly')}>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition duration-300"
                disabled={!userId}
              >
                {userId ? 'Assinar Plano Mensal' : 'Faça login para assinar'}
              </button>
            </form>
          </div>

          {/* Annual Plan Card */}
          <div className="bg-white p-8 rounded-lg shadow-xl border-2 border-green-500">
            <h3 className="text-3xl font-bold text-green-600 mb-4">Plano Anual</h3>
            <p className="text-5xl font-extrabold text-gray-900 mb-6">
              R$ 960<span className="text-xl font-medium text-gray-600">/ano</span>
            </p>
            <p className="text-lg text-gray-500 mb-4">Economize R$ 204 por ano!</p>
            <ul className="text-gray-700 space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Todos os recursos do Jurema
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Suporte prioritário
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Acesso exclusivo a novos recursos
              </li>
            </ul>
            <form action={handleSubscription.bind(null, 'annual')}>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300"
                disabled={!userId}
              >
                {userId ? 'Assinar Plano Anual' : 'Faça login para assinar'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}