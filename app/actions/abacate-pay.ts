'use server'

import prisma from '@/lib/prisma'

const ABACATE_PAY_API_URL = process.env.NEXT_PUBLIC_ABACATE_PAY_API_URL || 'https://api.abacatepay.com/v1'
const ABACATE_PAY_TOKEN = process.env.NEXT_PUBLIC_ABACATE_API_KEY || ''

interface PixResponse {
  data: {
    id: string;
    brCode: string;
    brCodeBase64: string;
    expiresAt: string;
  };
  error: any | null;
}

export async function generatePixQRCode(
  planType: 'monthly' | 'annual', 
  userId: string
): Promise<{ qrCodeUrl?: string; brCode?: string; externalId?: string; error?: string }> { // Adicionado externalId ao retorno
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, cpf: true, whatsapp: true },
        });

        if (!user) throw new Error('User not found');

        let amount: number;
        let description: string;

        if (planType === 'monthly') {
            amount = 9700;
            description = 'Assinatura Jurema - Plano Mensal';
        } else if (planType === 'annual') {
            amount = 96000;
            description = 'Assinatura Jurema - Plano Anual';
        } else {
            throw new Error('Plano inválido');
        }

        const externalId = `sub-${userId}-${planType}-${Date.now()}`;

        const body = JSON.stringify({
            amount,
            expiresIn: 3600,
            description,
            customer: {
                name: user.name || user.email,
                email: user.email,
                cellphone: user.whatsapp,
                taxId: user.cpf,
            },
            metadata: {
                userId: userId,
                plan: planType,
                externalId: externalId, // Usamos a variável aqui
            },
        });

        const response = await fetch(`${process.env.ABACATE_PAY_API_URL}/pixQrCode/create`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
            },
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: `Falha ao gerar QR Code: ${errorText}` };
        }

        const data: any = await response.json(); // Usando 'any' para simplificar

        if (data.error) {
            return { error: `Erro da API: ${JSON.stringify(data.error)}` };
        }
        
        // Retorna os dados, incluindo o externalId
        return {
            qrCodeUrl: data.data.brCodeBase64,
            brCode: data.data.brCode,
            externalId: externalId
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu.';
        return { error: errorMessage };
    }
}