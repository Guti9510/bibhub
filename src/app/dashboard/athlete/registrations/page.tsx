import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import BibActions from './_components/BibActions'

export default async function RegistrationsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, races(id, name, date, location, sport_type, distance, price, event_id)')
    .eq('athlete_id', athlete?.id ?? '')
    .order('registered_at', { ascending: false })

  // ── Determine canSwap per registration ─────────────────────────────────────
  // A race can be swapped if it belongs to an event that has > 1 race
  const eventIds = [...new Set(
    (registrations ?? [])
      .map(r => (r.races as unknown as { event_id?: string | null })?.event_id)
      .filter(Boolean) as string[]
  )]

  // Count published sibling races per event
  const siblingCounts: Record<string, number> = {}
  if (eventIds.length) {
    const { data: siblingRaces } = await admin
      .from('races')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'published')

    for (const r of siblingRaces ?? []) {
      if (!r.event_id) continue
      siblingCounts[r.event_id] = (siblingCounts[r.event_id] ?? 0) + 1
    }
  }

  // ── Active bib listings ─────────────────────────────────────────────────────
  const regIds = registrations?.map(r => r.id) ?? []
  const { data: activeListings } = regIds.length
    ? await admin
        .from('bib_transfers')
        .select('id, registration_id, transfer_type, asking_price, message')
        .in('registration_id', regIds)
        .eq('status', 'available')
    : { data: [] }

  const listingByRegId = Object.fromEntries(
    (activeListings ?? []).map(l => [l.registration_id, l])
  )

  const locale = await getLocale()
  const t = getT(locale)
  const ta = t.athleteDashboard
  const tr = t.registration

  const sportLabel = (s: string) => {
    if (locale === 'es') {
      return { running: 'Running', cycling: 'Ciclismo', swimming: 'Natación' }[s] ?? s
    }
    return s
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.sidebar.myRegistrations}</h1>
        <Link
          href="/bibs"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {t.sidebar.bibMarketplace} →
        </Link>
      </div>

      <div className="space-y-4">
        {registrations?.map(reg => {
          const race = reg.races as unknown as {
            id: string; name: string; date: string; location: string
            sport_type: string; distance: number; price: number; event_id: string | null
          } | null

          const eventId = race?.event_id ?? null
          const canSwap = !!(eventId && (siblingCounts[eventId] ?? 0) > 1)

          return (
            <div key={reg.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{race?.name}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {race?.location} · {race?.date ? new Date(race.date).toLocaleDateString(locale === 'es' ? 'es-CR' : 'en-US') : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500 capitalize">
                    {race?.sport_type ? sportLabel(race.sport_type) : ''} · {race?.distance} km
                  </p>
                </div>
                <PaymentBadge
                  status={reg.payment_status}
                  label={ta.paymentStatus[reg.payment_status as keyof typeof ta.paymentStatus] ?? reg.payment_status}
                />
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                {reg.shirt_size && <span>{tr.shirtSizeName}: <strong className="text-gray-600">{reg.shirt_size}</strong></span>}
                {reg.expected_finish_time && <span>{tr.finishTime}: <strong className="text-gray-600">{reg.expected_finish_time}</strong></span>}
              </div>

              <BibActions
                registrationId={reg.id}
                activeListing={listingByRegId[reg.id] ?? null}
                canSwap={canSwap}
              />
            </div>
          )
        })}

        {!registrations?.length && (
          <p className="text-sm text-gray-400">
            {ta.noRegistrationsYet}{' '}
            <Link href="/races" className="text-indigo-600 hover:underline">{ta.browseRaces}</Link>
          </p>
        )}
      </div>
    </div>
  )
}

function PaymentBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    refunded: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? ''}`}>
      {label}
    </span>
  )
}
