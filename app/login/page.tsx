"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { token } = await res.json();
        const now = new Date();
        now.setTime(now.getTime() + 60 * 60 * 1000); // 1 hour expiration
        document.cookie = `authToken=${token}; expires=${now.toUTCString()}; path=/`;
        router.push('/'); // Redirect to a protected page, e.g., dashboard
      } else {
        const { message } = await res.json();
        setError(message || 'Falha ao fazer login. Verifique suas credenciais.');
      }
    } catch (error) {
      setError('Ocorreu um erro inesperado.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-500 to-purple-600 text-gray-900">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl animate-fade-in-up">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-gray-800">
          Bem-vindo de Volta!
        </h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          Acesse sua conta Jurema e continue transformando suas finanças.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}