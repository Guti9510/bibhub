import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import { LanguageToggleDark } from '@/components/LanguageToggle'
import ClaimBibButton from './_components/ClaimBibButton'

const SPORT_COLORS: Record<string, string> = {
  running:  'bg-orange-50 text-orange-700 border-orange-200',
  cycling:  'bg-blue-50 text-blue-700 border-blue-200',
  swimming: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

const SPORT_EMOJI: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
}

type Params = Promise<{ id: string }>

export default async function RaceDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const locale = await getLocale()
  const t = getT(locale)
  const tr = t.races
  const tb = t.bibTransfer

  const { data: race } = await supabase
    .from('races')
    .select('*, organizers(name, email)')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!race) notFound()

  const color = SPORT_COLORS[race.sport_type] ?? SPORT_COLORS.running
  const emoji = SPORT_EMOJI[race.sport_type] ?? '🏃'
  const raceDate = new Date(race.date)
  const organizer = race.organizers as unknown as { name: string; email: string } | null
  const shirtSizes = race.shirt_sizes as string[]
  const isFree = Number(race.price) === 0

  // ── Current user context ────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  let currentAthleteId: string | null = null
  let isAlreadyRegistered = false

  if (user) {
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    currentAthleteId = athlete?.id ?? null

    if (currentAthleteId) {
      const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('race_id', id)
        .eq('athlete_id', currentAthleteId)
        .maybeSingle()
      isAlreadyRegistered = !!existing
    }
  }

  // ── Bib transfer listings ───────────────────────────────────────────────────
  const { data: bibListings } = await admin
    .from('bib_transfers')
    .select('id, seller_id, transfer_type, asking_price, message, athletes!seller_id(first_name, last_name)')
    .eq('race_id', id)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  type BibListing = {
    id: string
    seller_id: string
    transfer_type: string
    asking_price: number | null
    message: string | null
    athletes: { first_name: string; last_name: string } | null
  }
  const listings = (bibListings ?? []) as unknown as BibListing[]

  // ── Formatting ──────────────────────────────────────────────────────────────
  const sportLabel = (s: string) => {
    if (locale === 'es') {
      return { running: 'Running', cycling: 'Ciclismo', swimming: 'Natación' }[s] ?? s
    }
    return { running: 'Running', cycling: 'Cycling', swimming: 'Swimming' }[s] ?? s
  }

  const transferTypeLabel = (type: string) => {
    const map: Record<string, string> = { sell: tb.sell, swap: tb.swap, gift: tb.gift }
    return map[type] ?? type
  }

  const dateLong = raceDate.toLocaleDateString(locale === 'es' ? 'es-CR' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = raceDate.toLocaleTimeString(locale === 'es' ? 'es-CR' : 'en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">{t.common.bibhub}</Link>
          <div className="flex items-center gap-4">
            <LanguageToggleDark />
            <Link href="/races" className="text-sm text-gray-500 hover:text-gray-900">
              {tr.allRaces}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Left: race info ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title */}
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                {emoji} {sportLabel(race.sport_type)}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-gray-900">{race.name}</h1>
              {organizer && (
                <p className="mt-1 text-sm text-gray-500">
                  {tr.organizedBy} <span className="font-medium text-gray-700">{organizer.name}</span>
                </p>
              )}
            </div>

            {/* Key details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">{tr.raceDetails}</h2>
              <dl className="space-y-4">
                <DetailRow icon={<CalendarIcon />} label={tr.date} value={dateLong} />
                <DetailRow icon={<ClockIcon />} label={tr.startTime} value={timeStr} />
                <DetailRow icon={<LocationIcon />} label={tr.location} value={race.location} />
                <DetailRow icon={<DistanceIcon />} label={tr.distance} value={`${race.distance} km`} />
              </dl>
            </div>

            {/* Shirt sizes */}
            {shirtSizes.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  {tr.shirtSizesAvailable}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {shirtSizes.map(size => (
                    <span key={size} className="flex h-10 w-14 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold text-gray-700">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Bib marketplace ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{tb.availableBibs}</h2>
                <p className="mt-0.5 text-xs text-gray-400">{tb.availableBibsDesc}</p>
              </div>

              {listings.length === 0 ? (
                <p className="text-sm text-gray-400">{tb.noBibsAvailable}</p>
              ) : (
                <div className="space-y-3">
                  {listings.map(listing => {
                    const seller = listing.athletes
                    const sellerName = seller
                      ? `${seller.first_name} ${seller.last_name}`
                      : '—'
                    const isOwnListing = currentAthleteId === listing.seller_id

                    return (
                      <div key={listing.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{sellerName}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2 py-0.5 font-medium text-gray-600">
                                {transferTypeLabel(listing.transfer_type)}
                              </span>
                              {listing.asking_price ? (
                                <span className="font-semibold text-gray-800">${Number(listing.asking_price).toFixed(2)}</span>
                              ) : listing.transfer_type === 'gift' ? (
                                <span className="font-semibold text-green-700">{t.common.free}</span>
                              ) : (
                                <span className="text-gray-400">{tb.negotiable}</span>
                              )}
                            </div>
                            {listing.message && (
                              <p className="mt-1.5 text-xs text-gray-500 italic">{listing.message}</p>
                            )}
                          </div>
                          <div className="w-36 shrink-0">
                            <ClaimBibButton
                              transferId={listing.id}
                              sellerName={sellerName}
                              isLoggedIn={!!user}
                              isAlreadyRegistered={isAlreadyRegistered}
                              isOwnListing={isOwnListing}
                              raceId={id}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: registration card ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {isFree ? t.common.free : `$${Number(race.price).toFixed(2)}`}
                </p>
                <p className="mt-1 text-sm text-gray-400">{tr.perRegistration}</p>
              </div>

              {race.max_participants && (
                <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{race.max_participants}</p>
                  <p className="text-xs text-gray-400">{tr.maximumParticipants}</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {shirtSizes.length > 0 && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <span className="text-indigo-500">✓</span>
                    {tr.shirtSizeSelection}
                  </p>
                )}
                {listings.length > 0 && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <span className="text-indigo-500">✓</span>
                    {listings.length} {listings.length === 1
                      ? (locale === 'es' ? 'dorsal disponible' : 'bib available')
                      : (locale === 'es' ? 'dorsales disponibles' : 'bibs available')}
                  </p>
                )}
              </div>

              <Link
                href={`/races/${race.id}/register`}
                className="mt-6 block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors"
              >
                {tr.registerNow}
              </Link>

              <p className="mt-3 text-center text-xs text-gray-400">
                {tr.registrationManagedBy}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <dt className="text-xs font-medium text-gray-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function LocationIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function DistanceIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
