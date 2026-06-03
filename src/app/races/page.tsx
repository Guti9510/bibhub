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
  const loc = locale === 'es' ? 'es-CR' : 'en-US'

  // ── Fetch published events ──────────────────────────────────────────────────
  let eventsQuery = supabase
    .from('events')
    .select('id, name, date, location, sport_type, organizers(name)')
    .eq('status', 'published')
    .order('date', { ascending: true })

  if (sport && ['running', 'cycling', 'swimming'].includes(sport)) {
    eventsQuery = eventsQuery.eq('sport_type', sport)
  }
  if (q?.trim()) {
    eventsQuery = eventsQuery.ilike('name', `%${q.trim()}%`)
  }

  const { data: events } = await eventsQuery

  // ── Fetch races grouped under those events ──────────────────────────────────
  const eventIds = (events ?? []).map(e => e.id)

  const { data: allRaces } = eventIds.length
    ? await supabase
        .from('races')
        .select('id, event_id, name, distance, price, max_participants, date, shirt_sizes')
        .in('event_id', eventIds)
        .eq('status', 'published')
        .order('distance', { ascending: true })
    : { data: [] }

  // Also fetch standalone published races (no event_id) that match the filters
  let standaloneQuery = supabase
    .from('races')
    .select('id, event_id, name, date, location, sport_type, distance, price, max_participants, shirt_sizes, organizers(name)')
    .eq('status', 'published')
    .is('event_id', null)
    .order('date', { ascending: true })

  if (sport && ['running', 'cycling', 'swimming'].includes(sport)) {
    standaloneQuery = standaloneQuery.eq('sport_type', sport)
  }
  if (q?.trim()) {
    standaloneQuery = standaloneQuery.ilike('name', `%${q.trim()}%`)
  }

  const { data: standaloneRaces } = await standaloneQuery

  // ── Group races by event_id ─────────────────────────────────────────────────
  type RaceRow = NonNullable<typeof allRaces>[number]
  const racesByEvent = new Map<string, RaceRow[]>()
  for (const race of allRaces ?? []) {
    if (!race.event_id) continue
    if (!racesByEvent.has(race.event_id)) racesByEvent.set(race.event_id, [])
    racesByEvent.get(race.event_id)!.push(race)
  }

  // ── Build unified timeline items ────────────────────────────────────────────
  type EventItem = {
    kind: 'event'
    id: string
    name: string
    date: string
    location: string
    sport_type: string
    organizer: string | null
    races: RaceRow[]
  }
  type StandaloneItem = {
    kind: 'standalone'
    id: string
    name: string
    date: string
    location: string
    sport_type: string
    distance: number
    price: number
    max_participants: number
    shirt_sizes: string[]
    organizer: string | null
  }
  type TimelineItem = EventItem | StandaloneItem

  const items: TimelineItem[] = [
    ...(events ?? []).map(e => ({
      kind: 'event' as const,
      id: e.id,
      name: e.name,
      date: e.date,
      location: e.location,
      sport_type: e.sport_type,
      organizer: (e.organizers as unknown as { name: string } | null)?.name ?? null,
      races: racesByEvent.get(e.id) ?? [],
    })),
    ...(standaloneRaces ?? []).map(r => ({
      kind: 'standalone' as const,
      id: r.id,
      name: r.name,
      date: r.date,
      location: (r as { location?: string }).location ?? '',
      sport_type: (r as { sport_type?: string }).sport_type ?? 'running',
      distance: r.distance,
      price: r.price,
      max_participants: r.max_participants,
      shirt_sizes: (r.shirt_sizes as string[]) ?? [],
      organizer: ((r as { organizers?: unknown }).organizers as { name: string } | null)?.name ?? null,
    })),
  ]
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // ── Group timeline by month ─────────────────────────────────────────────────
  const byMonth = new Map<string, TimelineItem[]>()
  for (const item of items) {
    const d = new Date(item.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(item)
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const monthLabel = (key: string) => {
    const [year, month] = key.split('-')
    return new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString(loc, { month: 'long', year: 'numeric' })
  }

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
    if (diff < 0) return null
    if (diff === 0) return locale === 'es' ? 'Hoy' : 'Today'
    if (diff === 1) return locale === 'es' ? 'Mañana' : 'Tomorrow'
    return locale === 'es' ? `En ${diff} días` : `In ${diff} days`
  }

  const sportLabel = (s: string) => {
    if (locale === 'es') {
      return { running: 'Running', cycling: 'Ciclismo', swimming: 'Natación' }[s] ?? s
    }
    return { running: 'Running', cycling: 'Cycling', swimming: 'Swimming' }[s] ?? s
  }

  const distanceLabel = (km: number) => {
    if (km === 42.2 || km === 42.195) return locale === 'es' ? 'Maratón' : 'Marathon'
    if (km === 21.1 || km === 21.0975) return locale === 'es' ? 'Media' : 'Half'
    return `${km % 1 === 0 ? km : km}K`
  }

  const totalItems = items.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">{t.common.bibhub}</Link>
          <div className="flex items-center gap-4">
            <Link href="/bibs" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              🔁 {locale === 'es' ? 'Dorsales' : 'Bib Market'}
            </Link>
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

      {/* ── Hero / filters ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {locale === 'es' ? '📅 Calendario de Carreras' : '📅 Race Calendar'}
          </h1>
          <p className="mt-2 text-gray-500">
            {locale === 'es'
              ? 'Próximas carreras en Costa Rica — inscríbete en minutos.'
              : 'Upcoming races in Costa Rica — register in minutes.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Search */}
            <form method="GET" action="/races" className="flex">
              <input
                name="q"
                defaultValue={q}
                placeholder={locale === 'es' ? 'Buscar…' : 'Search…'}
                className="w-48 rounded-l-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {sport && <input type="hidden" name="sport" value={sport} />}
              <button type="submit" className="rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 py-2 text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Sport pills */}
            {[
              { value: undefined, label: locale === 'es' ? 'Todos' : 'All' },
              { value: 'running',  label: '🏃 Running' },
              { value: 'cycling',  label: locale === 'es' ? '🚴 Ciclismo' : '🚴 Cycling' },
              { value: 'swimming', label: locale === 'es' ? '🏊 Natación' : '🏊 Swimming' },
            ].map(tab => (
              <Link
                key={tab.label}
                href={tab.value
                  ? `/races?sport=${tab.value}${q ? `&q=${q}` : ''}`
                  : `/races${q ? `?q=${q}` : ''}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  sport === tab.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-4xl">🏁</p>
            <p className="mt-4 text-lg font-semibold text-gray-900">{tr.noRacesFound}</p>
            <p className="mt-2 text-sm text-gray-400">
              {sport ? tr.noSportRaces(sport) : tr.noPublishedRaces}
            </p>
            {(sport || q) && (
              <Link href="/races" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
                {tr.viewAllSports}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {[...byMonth.entries()].map(([monthKey, monthItems]) => (
              <section key={monthKey}>
                {/* Month divider */}
                <div className="mb-5 flex items-center gap-4">
                  <h2 className="text-lg font-bold capitalize text-gray-900">
                    {monthLabel(monthKey)}
                  </h2>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm text-gray-400">
                    {monthItems.length} {monthItems.length === 1
                      ? (locale === 'es' ? 'evento' : 'event')
                      : (locale === 'es' ? 'eventos' : 'events')}
                  </span>
                </div>

                <div className="space-y-3">
                  {monthItems.map(item => {
                    const color = SPORT_COLORS[item.sport_type] ?? SPORT_COLORS.running
                    const emoji = SPORT_EMOJI[item.sport_type] ?? '🏃'
                    const countdown = daysUntil(item.date)
                    const dateObj = new Date(item.date)

                    return (
                      <article
                        key={item.kind === 'event' ? `evt-${item.id}` : `race-${item.id}`}
                        className="flex items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                      >
                        {/* Date badge */}
                        <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-gray-100 bg-gray-50 px-3 py-5 text-center">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {dateObj.toLocaleDateString(loc, { month: 'short' })}
                          </span>
                          <span className="mt-0.5 text-3xl font-extrabold leading-none text-gray-900">
                            {dateObj.getDate()}
                          </span>
                          <span className="mt-1 text-xs text-gray-400">
                            {dateObj.toLocaleDateString(loc, { weekday: 'short' })}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col justify-center px-5 py-4 gap-2">
                          {/* Top row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
                              {emoji} {sportLabel(item.sport_type)}
                            </span>
                            {countdown && (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                                {countdown}
                              </span>
                            )}
                          </div>

                          {/* Name + location */}
                          <div>
                            <h3 className="text-base font-bold text-gray-900">
                              {item.name}
                            </h3>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                              <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {item.location}
                              {item.organizer && (
                                <span className="text-gray-400"> · {tr.by} {item.organizer}</span>
                              )}
                            </p>
                          </div>

                          {/* Distance options (event) or single distance (standalone) */}
                          {item.kind === 'event' && item.races.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {item.races.map(race => (
                                <Link
                                  key={race.id}
                                  href={`/races/${race.id}`}
                                  className="group/pill flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  <span>{distanceLabel(race.distance)}</span>
                                  <span className="text-xs font-normal text-gray-400 group-hover/pill:text-indigo-500">
                                    {Number(race.price) === 0 ? t.common.free : `$${Number(race.price).toFixed(0)}`}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          ) : item.kind === 'standalone' ? (
                            <div className="flex items-center gap-3 pt-1">
                              <Link
                                href={`/races/${item.id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <span>{item.distance} km</span>
                                <span className="text-xs font-normal text-gray-400">
                                  {Number(item.price) === 0 ? t.common.free : `$${Number(item.price).toFixed(0)}`}
                                </span>
                              </Link>
                              {item.max_participants && (
                                <span className="text-xs text-gray-400">
                                  {item.max_participants} {locale === 'es' ? 'cupos' : 'spots'}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {/* Arrow only for standalone (events have pill links) */}
                        {item.kind === 'standalone' && (
                          <div className="flex items-center pr-5 text-gray-300">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
