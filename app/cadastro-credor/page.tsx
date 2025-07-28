'use client';

import { useState, FormEvent } from 'react';

// Um ícone simples de loading para usar no botão
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function CadastrarCredor() {
  const [formData, setFormData] = useState({
    masterKey: '',
    email: '',
    cpf: '',
    password: '',
    whatsapp: '',
    pixKey: '',
    city: '',
    state: '',
  });
  
  // Novos estados para uma melhor experiência do utilizador
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
        setSuccessMessage('Credor cadastrado com sucesso! O formulário foi limpo.');
        // Limpa o formulário após o sucesso
        setFormData({
            masterKey: '',
            email: '',
            cpf: '',
            password: '',
            whatsapp: '',
            pixKey: '',
            city: '',
            state: ''
        });
      } else {
        setError(data.message || 'Erro ao cadastrar credor. Verifique os dados.');
      }
    } catch (error) {
      setError('Ocorreu um erro na comunicação com o servidor.');
    } finally {
      setIsLoading(false); // Garante que o loading para mesmo se houver erro
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-lg bg-gray-800 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Cadastro de Novo Credor
        </h1>
        <p className="mb-8 text-center text-gray-400">
          Preencha os campos abaixo para criar uma nova conta de credor no sistema Jurema.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agrupamento dos campos em grid para melhor layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-300">CPF</label>
              <input type="text" name="cpf" id="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Senha</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300">WhatsApp (com DDI)</label>
              <input type="text" name="whatsapp" id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="5561999998888" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
             <div>
              <label htmlFor="pixKey" className="block text-sm font-medium text-gray-300">Chave PIX</label>
              <input type="text" name="pixKey" id="pixKey" value={formData.pixKey} onChange={handleInputChange} placeholder="Sua chave PIX principal" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="masterKey" className="block text-sm font-medium text-gray-300">Token de Acesso (Master Key)</label>
              <input type="password" name="masterKey" id="masterKey" value={formData.masterKey} onChange={handleInputChange} placeholder="Chave de segurança" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                 <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-300">Cidade</label>
                    <input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} placeholder="Brasília" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-300">Estado (UF)</label>
                    <input type="text" name="state" id="state" value={formData.state} onChange={handleInputChange} placeholder="DF" required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
            </div>
          </div>

          {/* Mensagens de Sucesso e Erro */}
          {successMessage && <div className="rounded-md bg-green-900 p-4 text-center text-sm text-green-200">{successMessage}</div>}
          {error && <div className="rounded-md bg-red-900 p-4 text-center text-sm text-red-200">{error}</div>}

          <div>
            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <><LoadingSpinner /> Processando...</> : 'Cadastrar Credor'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}