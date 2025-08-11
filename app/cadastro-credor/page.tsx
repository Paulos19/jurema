'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

// Um ícone simples de loading para usar no botão
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function CadastrarCredor() {
  const router = useRouter(); // Initialize useRouter
  const [formData, setFormData] = useState({
    masterKey: '',
    name: '', // Added name field
    email: '',
    cpf: '',
    password: '',
    whatsapp: '',
    pixKey: '',
    city: '',
    state: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/criar_credor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Credor cadastrado com sucesso! Você será redirecionado para a página de login.');
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000); // 3 seconds delay
      } else {
        setError(data.message || 'Erro ao cadastrar credor. Verifique os dados.');
      }
    } catch (error) {
      setError('Ocorreu um erro na comunicação com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-500 to-purple-600 text-gray-900">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-2xl animate-fade-in-up">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-gray-800">
          Junte-se à Jurema!
        </h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          Cadastre-se como credor e comece a transformar sua gestão de empréstimos hoje mesmo.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} placeholder="Seu nome" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* CPF Field */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
              <input type="text" name="cpf" id="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* WhatsApp Field */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp (com DDI)</label>
              <input type="text" name="whatsapp" id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="5561999998888" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* PIX Key Field */}
            <div>
              <label htmlFor="pixKey" className="block text-sm font-medium text-gray-700">Chave PIX</label>
              <input type="text" name="pixKey" id="pixKey" value={formData.pixKey} onChange={handleInputChange} placeholder="Sua chave PIX principal" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* Master Key Field */}
            <div>
              <label htmlFor="masterKey" className="block text-sm font-medium text-gray-700">Token de Acesso (Master Key)</label>
              <input type="password" name="masterKey" id="masterKey" value={formData.masterKey} onChange={handleInputChange} placeholder="Chave de segurança" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* City Field */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
              <input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} placeholder="Brasília" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
            {/* State Field */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado (UF)</label>
              <input type="text" name="state" id="state" value={formData.state} onChange={handleInputChange} placeholder="DF" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2" />
            </div>
          </div>

          {/* Messages */}
          {successMessage && <div className="rounded-md bg-green-100 p-4 text-center text-sm text-green-700 animate-fade-in-up">{successMessage}</div>}
          {error && <div className="rounded-md bg-red-100 p-4 text-center text-sm text-red-700 animate-fade-in-up">{error}</div>}

          <div>
            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-lg font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out">
              {isLoading ? <><LoadingSpinner /> Processando...</> : 'Cadastrar Credor'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
