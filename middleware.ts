import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lista de rotas públicas que não exigem autenticação via middleware
  const publicRoutes = [
    '/api/login',
    '/api/criar_credor',
    '/api/criar_cliente',
    '/api/criar_conta',
    '/api/criar_emprestimo',
    '/api/criar_parcela',
    '/api/criar_transacao',
    '/api/registrar_pagamento',
    '/api/emprestimo-completo',
    '/api/installments/due',
    '/api/setup-accounts',
    '/api/amortize-payment',
    '/api/payment/register',
    '/api/loan/amortize-and-prepare',
    '/api/payment/prepare-recalculation',
    '/api/loan/update-plan',
    '/api/client/active',
    '/api/summary',
    '/api/subscription/create-charge',
    '/api/receitas',
  ];

  // Lista de rotas que começam com um prefixo e são públicas
  const publicPrefixes = [
    '/api/user/',
    '/api/client/',
    '/api/loan/',
    '/api/installment/',
    '/api/transaction/',
    '/api/webhook/',
    '/api/receitas/'
  ];

  // Verifica se a rota atual está na lista de rotas públicas exatas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Verifica se a rota atual começa com um dos prefixos públicos
  if (publicPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Se a rota não for pública, bloqueia o acesso
  return NextResponse.json({ message: 'Authentication required for this route' }, { status: 401 });
}

export const config = {
  matcher: '/api/:path*',
};