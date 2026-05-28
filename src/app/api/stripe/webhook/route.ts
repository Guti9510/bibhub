import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const { race_id, athlete_id, wave, shirt_size, expected_finish_time } = session.metadata ?? {}
    if (!race_id || !athlete_id) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

    const supabase = createAdminClient()

    // Upsert — success page may have already created this row
    await supabase.from('registrations').upsert(
      {
        race_id,
        athlete_id,
        wave: wave || null,
        shirt_size: shirt_size || null,
        expected_finish_time: expected_finish_time || null,
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
      },
      { onConflict: 'race_id,athlete_id' }
    )
  }

  return NextResponse.json({ received: true })
}
