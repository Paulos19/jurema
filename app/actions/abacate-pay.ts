'use server'

import { cookies } from 'next/headers'

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

export async function createPixPayment(product: Product) {
    try {
        if (product.price < 10) {
            throw new Error("Produto deve custar mais de 1 real")
        }

        const body = JSON.stringify({
            frequency: 'ONE_TIME',
            methods: ['PIX'],
            products: [product],
            returnUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            completionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/confirmacao`,
            customer: {
                name: 'Paulo Henrique',
                email: 'paulo@gmail.com',
                cellphone: '+5561986446934',
                taxId: '05814436166'
            }
        })

        const response = await fetch(`${ABACATE_PAY_API_URL}/billing/create`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ABACATE_PAY_TOKEN}`,
                'Accept': 'application/json'
            },
            body
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Pagamento falhou: ${errorText}`)
        }

        const data: BillingResponse = await response.json()
        return data

    } catch (error) {
        console.error(error)
    }
}