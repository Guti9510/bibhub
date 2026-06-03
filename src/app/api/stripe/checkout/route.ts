import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  const { race_id, shirt_size, expected_finish_time } = await request.json()

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!athlete) return NextResponse.json({ error: 'No athlete profile' }, { status: 400 })

  const { data: race } = await supabase
    .from('races')
    .select('id, name, price, date, location')
    .eq('id', race_id)
    .eq('status', 'published')
    .maybeSingle()
  if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 })

  const price = Number(race.price)
  if (price <= 0) return NextResponse.json({ error: 'Use free registration endpoint' }, { status: 400 })

  const baseUrl = request.nextUrl.origin

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: race.name,
            description: `${race.location} · ${new Date(race.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      race_id: race.id,
      athlete_id: athlete.id,
      shirt_size: shirt_size ?? '',
      expected_finish_time: expected_finish_time ?? '',
    },
    success_url: `${baseUrl}/races/${race_id}/register/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/races/${race_id}`,
  })

  return NextResponse.json({ url: session.url })
}
