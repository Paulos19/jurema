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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 text-gray-900 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-75 transform -skew-y-3"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up">
            Transforme Sua Gestão Financeira com Jurema
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-8 animate-fade-in-up animation-delay-200">
            A plataforma inteligente que otimiza seus empréstimos, pagamentos e comunicação.
          </p>
          <a
            href="#pricing"
            className="inline-block bg-white text-indigo-700 hover:bg-indigo-100 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition duration-300 ease-in-out animate-fade-in-up animation-delay-400"
          >
            Comece Agora
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up">
            Recursos Poderosos para o Seu Sucesso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2 animate-fade-in-up animation-delay-600">
              <div className="text-indigo-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Gestão de Empréstimos Simplificada</h3>
              <p className="text-gray-600 text-center">Controle total sobre seus empréstimos, clientes e parcelas, tudo em um só lugar.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2 animate-fade-in-up animation-delay-800">
              <div className="text-indigo-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h10m-9 4h8a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Pagamentos Automatizados</h3>
              <p className="text-gray-600 text-center">Integração perfeita com Abacate Pay para pagamentos e recebimentos rápidos e seguros.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2 animate-fade-in-up animation-delay-1000">
              <div className="text-indigo-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Comunicação Inteligente</h3>
              <p className="text-gray-600 text-center">Mantenha-se conectado com seus clientes através da integração com Evolution API via WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up">
            Escolha o Plano Perfeito para Você
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Monthly Plan Card */}
            <div className="bg-white text-gray-900 p-8 rounded-xl shadow-2xl transform hover:scale-105 transition duration-300 ease-in-out animate-fade-in-up animation-delay-1200">
              <h3 className="text-3xl font-bold text-indigo-700 mb-4">Plano Mensal</h3>
              <p className="text-5xl font-extrabold mb-6">
                R$ 97<span className="text-xl font-medium">/mês</span>
              </p>
              <ul className="text-gray-700 space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Acesso completo a todos os recursos do Jurema
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Suporte técnico dedicado
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Flexibilidade para cancelar a qualquer momento
                </li>
              </ul>
              <form action={handleSubscription.bind(null, 'monthly')}>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg text-xl font-semibold shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out"
                  disabled={!userId}
                >
                  {userId ? 'Assinar Plano Mensal' : 'Faça login para assinar'}
                </button>
              </form>
            </div>

            {/* Annual Plan Card */}
            <div className="bg-white text-gray-900 p-8 rounded-xl shadow-2xl transform hover:scale-105 transition duration-300 ease-in-out animate-fade-in-up animation-delay-1400">
              <h3 className="text-3xl font-bold text-purple-700 mb-4">Plano Anual</h3>
              <p className="text-5xl font-extrabold mb-6">
                R$ 960<span className="text-xl font-medium">/ano</span>
              </p>
              <p className="text-lg text-gray-600 mb-4">Economize R$ 204 por ano!</p>
              <ul className="text-gray-700 space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Tudo do Plano Mensal, e mais!
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Acesso prioritário a novos recursos e atualizações
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Consultoria financeira exclusiva (1 hora/ano)
                </li>
              </ul>
              <form action={handleSubscription.bind(null, 'annual')}>
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg text-xl font-semibold shadow-md hover:bg-purple-700 transition duration-300 ease-in-out"
                  disabled={!userId}
                >
                  {userId ? 'Assinar Plano Anual' : 'Faça login para assinar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Jurema. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
