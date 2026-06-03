import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import { LanguageToggleDark } from '@/components/LanguageToggle'
import MarketplaceClaim from './_components/MarketplaceClaim'

const TYPE_COLORS: Record<string, string> = {
  sell: 'bg-amber-50 text-amber-700 border-amber-200',
  swap: 'bg-blue-50 text-blue-700 border-blue-200',
  gift: 'bg-green-50 text-green-700 border-green-200',
}
const SPORT_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊',
}

type SearchParams = Promise<{ type?: string }>

export default async function BibMarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()
  const locale = await getLocale()
  const t = getT(locale)
  const tb = t.bibTransfer
  const loc = locale === 'es' ? 'es-CR' : 'en-US'

  // ── Current user & athlete ──────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myAthlete } = user
    ? await supabase.from('athletes').select('id').eq('user_id', user.id).maybeSingle()
    : { data: null }

  // ── Fetch available listings ─────────────────────────────────────────────────
  let query = admin
    .from('bib_transfers')
    .select(`
      id, transfer_type, asking_price, message, race_id, seller_id,
      races ( id, name, date, location, distance, sport_type, event_id ),
      athletes!bib_transfers_seller_id_fkey ( first_name, last_name )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (type && ['sell', 'swap', 'gift'].includes(type)) {
    query = query.eq('transfer_type', type)
  }

  const { data: listings } = await query

  // ── Fetch event names for multi-distance races ───────────────────────────────
  const eventIds = [...new Set(
    (listings ?? [])
      .map(l => (l.races as { event_id?: string | null })?.event_id)
      .filter(Boolean) as string[]
  )]

  const { data: events } = eventIds.length
    ? await admin.from('events').select('id, name').in('id', eventIds)
    : { data: [] }

  const eventNameById = Object.fromEntries((events ?? []).map(e => [e.id, e.name as string]))

  // ── My registrations (for swap eligibility) ──────────────────────────────────
  // Build a map of event_id → my registrations with race info
  type MyReg = { id: string; race_id: string; distance: number; name: string }
  const myRegsByEvent: Record<string, MyReg[]> = {}

  if (myAthlete) {
    const { data: myRegs } = await supabase
      .from('registrations')
      .select('id, race_id, races(id, name, distance, event_id)')
      .eq('athlete_id', myAthlete.id)

    for (const reg of myRegs ?? []) {
      const race = reg.races as unknown as { id: string; name: string; distance: number; event_id: string | null } | null
      if (!race?.event_id) continue
      if (!myRegsByEvent[race.event_id]) myRegsByEvent[race.event_id] = []
      myRegsByEvent[race.event_id].push({
        id: reg.id,
        race_id: race.id,
        distance: race.distance,
        name: race.name,
      })
    }
  }

  const distanceLabel = (km: number) => {
    if (km === 42.2 || km === 42.195) return locale === 'es' ? 'Maratón' : 'Marathon'
    if (km === 21.1 || km === 21.0975) return locale === 'es' ? 'Media' : 'Half'
    return `${km % 1 === 0 ? km : km}K`
  }

  const typeLabel = (tp: string) =>
    ({ sell: tb.forSale, swap: tb.forSwap, gift: tb.forGift }[tp] ?? tp)

  const filters = [
    { value: undefined,  label: tb.filterAll },
    { value: 'sell',     label: tb.forSale },
    { value: 'swap',     label: tb.forSwap },
    { value: 'gift',     label: tb.forGift },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">{t.common.bibhub}</Link>
          <div className="flex items-center gap-4">
            <Link href="/races" className="text-sm text-gray-500 hover:text-gray-800">
              {locale === 'es' ? 'Calendario' : 'Calendar'}
            </Link>
            <LanguageToggleDark />
            {user ? (
              <Link href="/dashboard/athlete/registrations" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                {t.sidebar.myRegistrations}
              </Link>
            ) : (
              <Link href="/auth/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                {t.common.signIn}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            🔁 {tb.marketplaceTitle}
          </h1>
          <p className="mt-2 text-gray-500">{tb.marketplaceSubtitle}</p>

          {/* Filter tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map(f => (
              <Link
                key={f.label}
                href={f.value ? `/bibs?type=${f.value}` : '/bibs'}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  type === f.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Login prompt banner for guests */}
      {!user && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
            <p className="text-sm text-amber-800">
              {locale === 'es'
                ? '👋 Inicia sesión para reclamar un dorsal o publicar el tuyo.'
                : '👋 Sign in to claim a bib or list your own.'}
            </p>
            <Link
              href="/auth/login"
              className="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              {t.common.signIn}
            </Link>
          </div>
        </div>
      )}

      {/* Listings */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        {!listings?.length ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-4xl">🏷️</p>
            <p className="mt-4 text-lg font-semibold text-gray-900">{tb.noBibsInMarketplace}</p>
            <Link href="/races" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
              {locale === 'es' ? 'Ver carreras →' : 'Browse races →'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => {
              const race = listing.races as unknown as {
                id: string; name: string; date: string; location: string
                distance: number; sport_type: string; event_id: string | null
              } | null
              const seller = listing.athletes as unknown as { first_name: string; last_name: string } | null
              const eventId = race?.event_id ?? null
              const eventName = eventId ? eventNameById[eventId] : null

              // Swap options: my registrations in same event, different race
              const swapOptions = (listing.transfer_type === 'swap' && eventId && myAthlete)
                ? (myRegsByEvent[eventId] ?? []).filter(r => r.race_id !== race?.id)
                : []

              const isMyListing = myAthlete?.id === listing.seller_id
              const dateObj = race ? new Date(race.date) : null

              return (
                <article key={listing.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-stretch">
                    {/* Sport stripe */}
                    <div className="w-1.5 shrink-0 bg-indigo-500" />

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      {/* Top row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[listing.transfer_type]}`}>
                            {typeLabel(listing.transfer_type)}
                          </span>
                          {listing.asking_price && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                              ${Number(listing.asking_price).toFixed(0)}
                            </span>
                          )}
                        </div>
                        {seller && (
                          <span className="text-xs text-gray-400">
                            {tb.listedBy} <strong className="text-gray-600">{seller.first_name} {seller.last_name}</strong>
                          </span>
                        )}
                      </div>

                      {/* Race info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{SPORT_EMOJI[race?.sport_type ?? 'running']}</span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {eventName ?? race?.name}
                              {eventName && race && (
                                <span className="ml-2 text-sm font-normal text-indigo-600">
                                  {distanceLabel(race.distance)}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {race?.location}
                              {dateObj && (
                                <span className="ml-2 text-gray-400">
                                  · {dateObj.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {listing.message && (
                          <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm italic text-gray-500">
                            "{listing.message}"
                          </p>
                        )}
                      </div>

                      {/* Claim action */}
                      <MarketplaceClaim
                        transferId={listing.id}
                        transferType={listing.transfer_type as 'sell' | 'swap' | 'gift'}
                        askingPrice={listing.asking_price}
                        sellerName={seller ? `${seller.first_name} ${seller.last_name}` : 'athlete'}
                        raceName={eventName ?? race?.name ?? ''}
                        raceDistance={race ? distanceLabel(race.distance) : ''}
                        isLoggedIn={!!user}
                        isMyListing={isMyListing}
                        swapOptions={swapOptions}
                        locale={locale}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
