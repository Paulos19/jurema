'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { addMonths, addYears } from 'date-fns'

const ABACATE_PAY_API_URL = process.env.NEXT_PUBLIC_ABACATE_PAY_API_URL || 'https://api.abacatepay.com/v1'
const ABACATE_PAY_TOKEN = process.env.NEXT_PUBLIC_ABACATE_API_KEY || ''

interface Product {
    externalId: string
    name: string
    description: string;
    quantity: number;
    price: number;
}

interface BillingResponse {
  data: {
    id: string;
    url: string;
    amount: number;
    status: string;
    devMode: boolean;
    methods: string[];
    products: {
      id: string;
      externalId: string;
      quantity: number;
    }[];
    frequency: string;
    nextBilling: string | null;
    customer: {
      id: string;
      metadata: {
        name: string;
        cellphone: string;
        email: string;
        taxId: string;
      };
    };
    allowCoupons: boolean;
    coupons: any[];
  };
  error: any | null;
}

export async function createSubscription(planType: 'monthly' | 'annual', userId: string) {
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

        let product: Product;
        let frequency: string;

        if (planType === 'monthly') {
            product = {
                externalId: 'jurema-monthly-plan',
                name: 'Plano Jurema Mensal',
                description: 'Assinatura mensal do Jurema',
                quantity: 1,
                price: 100, // R$ 97.00 (in cents)
            };
            frequency = 'ONE_TIME';
        } else if (planType === 'annual') {
            product = {
                externalId: 'jurema-annual-plan',
                name: 'Plano Jurema Anual',
                description: 'Assinatura anual do Jurema',
                quantity: 1,
                price: 100, // R$ 960.00 (in cents)
            };
            frequency = 'ONE_TIME';
        } else {
            throw new Error('Invalid plan type');
        }

        const body = JSON.stringify({
            frequency: frequency,
            methods: ['PIX'], // Assuming these are valid methods for subscription
            products: [product],
            returnUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            completionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/confirmacao`,
            customer: {
                name: user.name || user.email, // Use name if available, otherwise email
                email: user.email,
                cellphone: user.whatsapp,
                taxId: user.cpf,
            },
        });

        const response = await fetch(`${ABACATE_PAY_API_URL}/billing/create`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ABACATE_PAY_TOKEN}`,
                'Accept': 'application/json'
            },
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pagamento falhou: ${errorText}`);
        }

        const data: BillingResponse = await response.json();

        // Update user's subscription status and due date
        let newSubscriptionStatus: 'ACTIVE_MONTHLY' | 'ACTIVE_ANNUAL';
        let newSubscriptionDueDate: Date;

        if (planType === 'monthly') {
            newSubscriptionStatus = 'ACTIVE_MONTHLY';
            newSubscriptionDueDate = addMonths(new Date(), 1);
        } else { // annual
            newSubscriptionStatus = 'ACTIVE_ANNUAL';
            newSubscriptionDueDate = addYears(new Date(), 1);
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: newSubscriptionStatus,
                subscriptionDueDate: newSubscriptionDueDate,
            },
        });

        redirect(data.data.url); // Redirect to Abacate Pay URL

    } catch (error) {
        console.error(error);
        // Optionally redirect to an error page or display a message
        throw error; // Re-throw to be caught by the client-side form handler
    }
}
