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

export async function generatePixQRCode(planType: 'monthly' | 'annual', userId: string): Promise<{ qrCodeUrl?: string; brCode?: string; error?: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                cpf: true,
                whatsapp: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        let amount: number;
        let description: string;

        if (planType === 'monthly') {
            amount = 9700; // R$ 97,00 em centavos
            description = 'Assinatura Jurema - Plano Mensal';
        } else if (planType === 'annual') {
            amount = 96000; // R$ 960,00 em centavos
            description = 'Assinatura Jurema - Plano Anual';
        } else {
            throw new Error('Plano inválido');
        }

        const body = JSON.stringify({
            amount,
            expiresIn: 3600, // QR Code expira em 1 hora (3600 segundos)
            description,
            customer: {
                name: user.name || user.email,
                email: user.email,
                cellphone: user.whatsapp,
                taxId: user.cpf,
            },
            metadata: {
                externalId: `sub-${userId}-${planType}-${Date.now()}`,
            },
        });

        const response = await fetch(`${ABACATE_PAY_API_URL}/pixQrCode/create`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ABACATE_PAY_TOKEN}`,
            },
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Falha na API Abacate Pay:', errorText);
            return { error: `Falha ao gerar QR Code: ${errorText}` };
        }

        const data: PixResponse = await response.json();

        if (data.error) {
            console.error('Erro retornado pela API Abacate Pay:', data.error);
            return { error: `Erro da API: ${JSON.stringify(data.error)}` };
        }
        
        // Retorna os dados do QR Code para o frontend
        return {
            qrCodeUrl: data.data.brCodeBase64,
            brCode: data.data.brCode
        };

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu.';
        return { error: errorMessage };
    }
}