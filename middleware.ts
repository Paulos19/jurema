import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Allow access to login, user creation, and client creation routes without authentication
  if (request.nextUrl.pathname === '/api/login' || request.nextUrl.pathname === '/api/criar_credor' || request.nextUrl.pathname === '/api/criar_cliente' || request.nextUrl.pathname === '/api/criar_conta' || request.nextUrl.pathname === '/api/criar_emprestimo' || request.nextUrl.pathname === '/api/criar_parcela' || request.nextUrl.pathname.startsWith('/api/user/') || request.nextUrl.pathname.startsWith('/api/client/') || request.nextUrl.pathname.startsWith('/api/loan/') || request.nextUrl.pathname.startsWith('/api/installment/') || request.nextUrl.pathname.startsWith('/api/transaction/') || request.nextUrl.pathname === '/api/criar_transacao' || request.nextUrl.pathname === '/api/registrar_pagamento' || request.nextUrl.pathname.startsWith('/api/webhook')) {
    return NextResponse.next();
  }

  // For any other API routes that require authentication, you would implement your logic here.
  // For example, checking for an API key or a different token.
  return NextResponse.json({ message: 'Authentication required for this route' }, { status: 401 });
}

export const config = {
  matcher: '/api/:path*',
};