import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const webhookSecret = process.env.NEXT_PUBLIC_ABACATE_PAY_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('webhookSecret')

  if (secret !== webhookSecret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  try {
    const event = await req.json()

    // Log the event for debugging
    console.log('Received webhook:', event)

    // Save the event to the database
    await prisma.webhookEvent.create({
      data: {
        eventType: event.event,
        payload: event,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}
