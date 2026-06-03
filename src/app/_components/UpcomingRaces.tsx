import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

const SPORT_COLORS: Record<string, string> = {
  running:  'bg-orange-50 text-orange-700 border-orange-200',
  cycling:  'bg-blue-50 text-blue-700 border-blue-200',
  swimming: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}
const SPORT_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊',
}

export default async function UpcomingRaces() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = getT(locale)
  const th = t.home
  const loc = locale === 'es' ? 'es-CR' : 'en-US'

  // Fetch the next 4 published events
  const { data: events } = await supabase
    .from('events')
    .select('id, name, date, location, sport_type, organizers(name)')
    .eq('status', 'published')
    .gte('date', new Date().toISOString().slice(0, 10))
    .order('date', { ascending: true })
    .limit(4)

  // Fetch races for those events
  const eventIds = (events ?? []).map(e => e.id)
  const { data: races } = eventIds.length
    ? await supabase
        .from('races')
        .select('id, event_id, distance, price')
        .in('event_id', eventIds)
        .eq('status', 'published')
        .order('distance', { ascending: true })
    : { data: [] }

  // Also fetch up to (4 - events.length) standalone races to fill the gap
  const remaining = 4 - (events ?? []).length
  const { data: standalones } = remaining > 0
    ? await supabase
        .from('races')
        .select('id, name, date, location, sport_type, distance, price, max_participants')
        .eq('status', 'published')
        .is('event_id', null)
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date', { ascending: true })
        .limit(remaining)
    : { data: [] }

  // Group races by event
  type RaceRow = { id: string; event_id: string | null; distance: number; price: number }
  const racesByEvent = new Map<string, RaceRow[]>()
  for (const race of (races ?? []) as RaceRow[]) {
    if (!race.event_id) continue
    if (!racesByEvent.has(race.event_id)) racesByEvent.set(race.event_id, [])
    racesByEvent.get(race.event_id)!.push(race)
  }

  const distanceLabel = (km: number) => {
    if (km === 42.2 || km === 42.195) return locale === 'es' ? 'Maratón' : 'Marathon'
    if (km === 21.1 || km === 21.0975) return locale === 'es' ? 'Media' : 'Half'
    return `${km % 1 === 0 ? km : km}K`
  }

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
    if (diff <= 0) return null
    if (diff === 1) return locale === 'es' ? 'Mañana' : 'Tomorrow'
    return locale === 'es' ? `En ${diff} días` : `In ${diff} days`
  }

  const sportLabel = (s: string) =>
    locale === 'es'
      ? ({ running: 'Running', cycling: 'Ciclismo', swimming: 'Natación' }[s] ?? s)
      : ({ running: 'Running', cycling: 'Cycling', swimming: 'Swimming' }[s] ?? s)

  const allItems = [
    ...(events ?? []).map(e => ({
      kind: 'event' as const,
      id: e.id,
      name: e.name,
      date: e.date as string,
      location: e.location as string,
      sport_type: e.sport_type as string,
      races: racesByEvent.get(e.id) ?? [],
    })),
    ...(standalones ?? []).map(r => ({
      kind: 'standalone' as const,
      id: r.id as string,
      name: r.name as string,
      date: r.date as string,
      location: (r as { location?: string }).location ?? '',
      sport_type: (r as { sport_type?: string }).sport_type ?? 'running',
      distance: r.distance as number,
      price: r.price as number,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
   .slice(0, 4)

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-6">
        {/* Section header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{th.upcomingRaces}</h2>
            <p className="mt-1 text-gray-500">{th.upcomingRacesSubtitle}</p>
          </div>
          <Link
            href="/races"
            className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-800 sm:block"
          >
            {th.viewCalendar}
          </Link>
        </div>

        {allItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <p className="text-4xl">🏁</p>
            <p className="mt-3 text-gray-500">{th.noUpcomingRaces}</p>
            <Link href="/races" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline">
              {th.viewCalendar}
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {allItems.map(item => {
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
                    <div className="flex flex-1 flex-col justify-center gap-2 px-5 py-4">
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

                      <div>
                        <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                          <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.location}
                        </p>
                      </div>

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
                        <Link
                          href={`/races/${item.id}`}
                          className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <span>{distanceLabel(item.distance)}</span>
                          <span className="text-xs font-normal text-gray-400">
                            {Number(item.price) === 0 ? t.common.free : `$${Number(item.price).toFixed(0)}`}
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Mobile "view all" link */}
            <div className="mt-6 text-center sm:hidden">
              <Link href="/races" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                {th.viewCalendar}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
