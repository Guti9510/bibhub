import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getResend, registrationConfirmationEmail } from '@/lib/resend'
import type { Database } from '@/types/database'

const SPORT_EMOJIS: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
}

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
    .select('id, first_name, last_name, email')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!athlete) return NextResponse.json({ error: 'No athlete profile' }, { status: 400 })

  const { data: race } = await supabase
    .from('races')
    .select('id, name, date, location, distance, sport_type, price')
    .eq('id', race_id)
    .eq('status', 'published')
    .maybeSingle()
  if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 })

  if (Number(race.price) !== 0) {
    return NextResponse.json({ error: 'Race is not free' }, { status: 400 })
  }

  const { data: registration, error } = await supabase
    .from('registrations')
    .insert({
      race_id,
      athlete_id: athlete.id,
      shirt_size: shirt_size || null,
      expected_finish_time: expected_finish_time || null,
      payment_status: 'paid',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already registered for this race' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send confirmation email (best-effort; don't fail the registration if it errors)
  try {
    await getResend().emails.send(
      registrationConfirmationEmail({
        athleteName: `${athlete.first_name} ${athlete.last_name}`,
        athleteEmail: athlete.email,
        raceName: race.name,
        raceDate: new Date(race.date),
        raceLocation: race.location,
        raceDistance: Number(race.distance),
        sportEmoji: SPORT_EMOJIS[race.sport_type] ?? '🏁',
        wave: null,
        shirtSize: shirt_size || null,
        expectedFinishTime: expected_finish_time || null,
        price: 0,
      })
    )
  } catch {
    // Email failure is non-fatal
  }

  return NextResponse.json({ id: registration.id })
}
