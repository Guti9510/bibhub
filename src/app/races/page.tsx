import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import { LanguageToggleDark } from '@/components/LanguageToggle'

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

type SearchParams = Promise<{ sport?: string; q?: string }>

export default async function PublicRacesPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport, q } = await searchParams
  const supabase = await createClient()
  const locale = await getLocale()
  const t = getT(locale)
  const tr = t.races

  let query = supabase
    .from('races')
    .select('id, name, date, location, sport_type, distance, price, max_participants, organizer_id, organizers(name)')
    .eq('status', 'published')
    .order('date', { ascending: true })

  if (sport && ['running', 'cycling', 'swimming'].includes(sport)) {
    query = query.eq('sport_type', sport)
  }
  if (q?.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }

  const { data: races } = await query

  const dateFmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-CR' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

  const timeFmt = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(locale === 'es' ? 'es-CR' : 'en-US', {
      hour: 'numeric', minute: '2-digit',
    })

  // Sport labels by locale
  const sportLabel = (s: string) => {
    if (locale === 'es') {
      return { running: 'Running', cycling: 'Ciclismo', swimming: 'Natación' }[s] ?? s
    }
    return { running: 'Running', cycling: 'Cycling', swimming: 'Swimming' }[s] ?? s
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">{t.common.bibhub}</Link>
          <div className="flex items-center gap-4">
            <LanguageToggleDark />
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              {t.common.signIn}
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {tr.forOrganizers}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{tr.upcomingRaces}</h1>
          <p className="mt-2 text-gray-500">{tr.findYourNextChallenge}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SportFilter active={sport} t={tr} />
        </div>

        {/* Race grid */}
        {!races?.length ? (
          <EmptyState sport={sport} t={tr} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {races.map(race => {
              const color = SPORT_COLORS[race.sport_type] ?? SPORT_COLORS.running
              const emoji = SPORT_EMOJI[race.sport_type] ?? '🏃'
              const organizer = race.organizers as unknown as { name: string } | null

              return (
                <Link key={race.id} href={`/races/${race.id}`} className="group">
                  <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                        {emoji} {sportLabel(race.sport_type)}
                      </span>
                      <span className="text-xs font-medium text-gray-400">{dateFmt(race.date)}</span>
                    </div>

                    <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {race.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {race.location}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {race.distance} km &middot; {timeFmt(race.date)}
                    </p>

                    <div className="flex-1" />

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm font-bold text-gray-900">
                        {Number(race.price) === 0 ? t.common.free : `$${Number(race.price).toFixed(0)}`}
                      </span>
                      {race.max_participants && (
                        <span className="text-xs text-gray-400">
                          {race.max_participants} {tr.spots}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                        {tr.viewRace}
                      </span>
                    </div>

                    {organizer && (
                      <p className="mt-2 text-xs text-gray-400">{tr.by} {organizer.name}</p>
                    )}
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sport filter tabs ──────────────────────────────────────────────────────────

function SportFilter({ active, t }: { active?: string; t: ReturnType<typeof getT>['races'] }) {
  const tabs = [
    { value: undefined, label: t.allSports },
    { value: 'running', label: '🏃 Running' },
    { value: 'cycling', label: '🚴 Cycling' },
    { value: 'swimming', label: '🏊 Swimming' },
  ]
  return (
    <div className="flex gap-2">
      {tabs.map(tab => (
        <Link
          key={tab.label}
          href={tab.value ? `/races?sport=${tab.value}` : '/races'}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            active === tab.value
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

function EmptyState({ sport, t }: { sport?: string; t: ReturnType<typeof getT>['races'] }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="text-4xl">🏁</p>
      <p className="mt-4 text-lg font-semibold text-gray-900">{t.noRacesFound}</p>
      <p className="mt-2 text-sm text-gray-400">
        {sport ? t.noSportRaces(sport) : t.noPublishedRaces}
      </p>
      {sport && (
        <Link href="/races" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
          {t.viewAllSports}
        </Link>
      )}
    </div>
  )
}
