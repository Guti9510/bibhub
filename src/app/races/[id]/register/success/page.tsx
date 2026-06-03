import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStripe } from '@/lib/stripe'
import { getResend, registrationConfirmationEmail } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import type { Translations } from '@/lib/i18n/locales/en'

const SPORT_EMOJI: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
}

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ session_id?: string; rid?: string }>

export default async function RegistrationSuccessPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id: raceId } = await params
  const { session_id, rid } = await searchParams
  const supabase = createAdminClient()
  const locale = await getLocale()
  const t = getT(locale)

  // ── Paid race: verify Stripe session and upsert registration ──────────────
  if (session_id) {
    let session
    try {
      session = await getStripe().checkout.sessions.retrieve(session_id)
    } catch {
      notFound()
    }

    if (session.payment_status !== 'paid') notFound()

    const { race_id, athlete_id, wave, shirt_size, expected_finish_time } =
      session.metadata ?? {}

    if (!race_id || !athlete_id || race_id !== raceId) notFound()

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as { id: string } | null)?.id ?? null

    const { data: reg } = await supabase
      .from('registrations')
      .upsert(
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
      .select('id, wave, shirt_size, expected_finish_time, registered_at')
      .single()

    if (!reg) notFound()

    const [{ data: race }, { data: athlete }] = await Promise.all([
      supabase.from('races').select('name, date, location, distance, sport_type, price').eq('id', race_id).single(),
      supabase.from('athletes').select('first_name, last_name, email').eq('id', athlete_id).single(),
    ])

    if (!race || !athlete) notFound()

    const registeredJustNow = reg.registered_at
      ? Date.now() - new Date(reg.registered_at).getTime() < 30_000
      : false
    if (registeredJustNow) {
      try {
        await getResend().emails.send(
          registrationConfirmationEmail({
            athleteName: `${athlete.first_name} ${athlete.last_name}`,
            athleteEmail: athlete.email,
            raceName: race.name,
            raceDate: new Date(race.date),
            raceLocation: race.location,
            raceDistance: Number(race.distance),
            sportEmoji: SPORT_EMOJI[race.sport_type] ?? '🏁',
            wave: reg.wave,
            shirtSize: reg.shirt_size,
            expectedFinishTime: reg.expected_finish_time,
            price: Number(race.price),
          })
        )
      } catch {
        // Email failure is non-fatal
      }
    }

    return (
      <ConfirmationView
        t={t}
        locale={locale}
        raceName={race.name}
        raceDate={race.date}
        raceLocation={race.location}
        raceDistance={Number(race.distance)}
        sportEmoji={SPORT_EMOJI[race.sport_type] ?? '🏁'}
        athleteName={`${athlete.first_name} ${athlete.last_name}`}
        shirtSize={reg.shirt_size}
        expectedFinishTime={reg.expected_finish_time}
        price={Number(race.price)}
      />
    )
  }

  // ── Free race: load existing registration ────────────────────────────────
  if (rid) {
    const { data: reg } = await supabase
      .from('registrations')
      .select('id, race_id, wave, shirt_size, expected_finish_time, athletes(first_name, last_name, email), races(name, date, location, distance, sport_type, price)')
      .eq('id', rid)
      .maybeSingle()

    if (!reg) notFound()
    if (reg.race_id !== raceId) notFound()

    const race = reg.races as unknown as {
      name: string; date: string; location: string; distance: string; sport_type: string; price: string
    } | null
    const athlete = reg.athletes as unknown as {
      first_name: string; last_name: string; email: string
    } | null

    if (!race || !athlete) notFound()

    return (
      <ConfirmationView
        t={t}
        locale={locale}
        raceName={race.name}
        raceDate={race.date}
        raceLocation={race.location}
        raceDistance={Number(race.distance)}
        sportEmoji={SPORT_EMOJI[race.sport_type] ?? '🏁'}
        athleteName={`${athlete.first_name} ${athlete.last_name}`}
        shirtSize={reg.shirt_size}
        expectedFinishTime={reg.expected_finish_time}
        price={Number(race.price)}
      />
    )
  }

  notFound()
}

// ─── Confirmation UI ────────────────────────────────────────────────────────

function ConfirmationView({
  t,
  locale,
  raceName,
  raceDate,
  raceLocation,
  raceDistance,
  sportEmoji,
  athleteName,
  shirtSize,
  expectedFinishTime,
  price,
}: {
  t: Translations
  locale: string
  raceName: string
  raceDate: string
  raceLocation: string
  raceDistance: number
  sportEmoji: string
  athleteName: string
  shirtSize: string | null
  expectedFinishTime: string | null
  price: number
}) {
  const tr = t.registration
  const dateObj = new Date(raceDate)
  const loc = locale === 'es' ? 'es-CR' : 'en-US'

  const dateLong = dateObj.toLocaleDateString(loc, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const timeStr = dateObj.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{tr.registrationSuccess}</h1>
          <p className="mt-1 text-sm text-gray-500">{tr.successSubtitle}</p>
        </div>

        {/* Race details card */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-400">{tr.raceName}</p>
            <p className="mt-0.5 text-base font-bold text-gray-900">{sportEmoji} {raceName}</p>
          </div>

          <dl className="space-y-3">
            <ConfirmRow label={t.races.date} value={dateLong} />
            <ConfirmRow label={t.races.startTime} value={timeStr} />
            <ConfirmRow label={t.races.location} value={raceLocation} />
            <ConfirmRow label={t.races.distance} value={`${raceDistance} km`} />
            {shirtSize && <ConfirmRow label={tr.shirtSizeName} value={shirtSize} />}
            {expectedFinishTime && <ConfirmRow label={tr.finishTime} value={expectedFinishTime} />}
            <ConfirmRow
              label={tr.paymentStatus}
              value={price === 0 ? t.common.free : `$${price.toFixed(2)} ${tr.paid.toLowerCase()}`}
              highlight
            />
          </dl>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard/athlete"
            className="w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors"
          >
            {tr.goToDashboard}
          </Link>
          <Link
            href="/races"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {tr.viewAllRaces}
          </Link>
        </div>
      </div>
    </div>
  )
}

function ConfirmRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm font-medium ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</dd>
    </div>
  )
}
