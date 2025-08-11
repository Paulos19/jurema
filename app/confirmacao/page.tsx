"use client";

import Link from 'next/link';

export default function ConfirmacaoPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
        <svg
          className="mx-auto h-16 w-16 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Pagamento Confirmado!</h1>
        <p className="mt-2 text-lg text-gray-600">
          Sua assinatura foi ativada com sucesso. Bem-vindo(a) ao Jurema!
        </p>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Ir para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
