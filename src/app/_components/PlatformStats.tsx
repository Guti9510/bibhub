import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

// Participants from Maratón San José 2026 (demo data, not yet in registrations table)
const DEMO_PARTICIPANT_OFFSET = 9_800
// Demo floor so numbers never read "0" while the platform is early
const DEMO_ATHLETE_FLOOR = 312

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return n.toString()
}

export default async function PlatformStats() {
  const admin  = createAdminClient()
  const locale = await getLocale()
  const t      = getT(locale)
  const th     = t.home

  const [
    { count: eventsCount },
    { count: athletesCount },
    { count: registrationsCount },
  ] = await Promise.all([
    admin.from('events').select('*', { count: 'exact', head: true }).in('status', ['published', 'closed']),
    admin.from('athletes').select('*', { count: 'exact', head: true }),
    admin.from('registrations').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      value: formatNum(Math.max(eventsCount ?? 0, 1)),
      label: th.statsEvents,
      sublabel: locale === 'es' ? 'organizados' : 'organized',
    },
    {
      value: formatNum(Math.max(athletesCount ?? 0, DEMO_ATHLETE_FLOOR)),
      label: th.statsAthletes,
      sublabel: locale === 'es' ? 'registrados' : 'registered',
    },
    {
      value: formatNum((registrationsCount ?? 0) + DEMO_PARTICIPANT_OFFSET),
      label: th.statsParticipants,
      sublabel: locale === 'es' ? 'en carreras' : 'across races',
    },
  ]

  return (
    <section className="bg-indigo-600 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 divide-y divide-indigo-500 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center py-10 text-center sm:px-8 sm:py-0">
              <span className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                {stat.value}
              </span>
              <span className="mt-2 text-base font-bold text-white">
                {stat.label}
              </span>
              <span className="mt-0.5 text-sm text-indigo-300">
                {stat.sublabel}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-indigo-300/70">{th.statsTagline}</p>
      </div>
    </section>
  )
}
