import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const SPORT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  running:  { label: 'Running',  emoji: '🏃', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  cycling:  { label: 'Cycling',  emoji: '🚴', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  swimming: { label: 'Swimming', emoji: '🏊', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
}

type SearchParams = Promise<{ sport?: string; q?: string }>

export default async function PublicRacesPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport, q } = await searchParams
  const supabase = await createClient()

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">BibHub</Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              For organizers
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Races</h1>
          <p className="mt-2 text-gray-500">Find your next challenge and register in minutes.</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SportFilter active={sport} />
        </div>

        {/* Race grid */}
        {!races?.length ? (
          <EmptyState sport={sport} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {races.map(race => {
              const meta = SPORT_LABELS[race.sport_type] ?? SPORT_LABELS.running
              const raceDate = new Date(race.date)
              const organizer = race.organizers as unknown as { name: string } | null

              return (
                <Link key={race.id} href={`/races/${race.id}`} className="group">
                  <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
                    {/* Sport + date row */}
                    <div className="mb-4 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        {raceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Name + location */}
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

                    {/* Distance + time */}
                    <p className="mt-1 text-sm text-gray-400">
                      {race.distance} km &middot;{' '}
                      {raceDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Footer row */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm font-bold text-gray-900">
                        {Number(race.price) === 0 ? 'Free' : `$${Number(race.price).toFixed(0)}`}
                      </span>
                      {race.max_participants && (
                        <span className="text-xs text-gray-400">
                          {race.max_participants} spots
                        </span>
                      )}
                      <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                        View race →
                      </span>
                    </div>

                    {organizer && (
                      <p className="mt-2 text-xs text-gray-400">by {organizer.name}</p>
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

function SportFilter({ active }: { active?: string }) {
  const tabs = [
    { value: undefined, label: 'All sports' },
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

function EmptyState({ sport }: { sport?: string }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="text-4xl">🏁</p>
      <p className="mt-4 text-lg font-semibold text-gray-900">No races found</p>
      <p className="mt-2 text-sm text-gray-400">
        {sport
          ? `No published ${sport} races at the moment.`
          : 'No races are published yet. Check back soon!'}
      </p>
      {sport && (
        <Link href="/races" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
          View all sports
        </Link>
      )}
    </div>
  )
}
