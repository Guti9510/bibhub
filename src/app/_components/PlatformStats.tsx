import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return n.toString()
}

export default async function PlatformStats() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = getT(locale)
  const th = t.home

  const [
    { count: eventsCount },
    { count: athletesCount },
    { count: registrationsCount },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('athletes').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { value: eventsCount ?? 0,        label: th.statsEvents,       icon: '🏁' },
    { value: athletesCount ?? 0,      label: th.statsAthletes,     icon: '🏃' },
    { value: registrationsCount ?? 0, label: th.statsParticipants, icon: '🎽' },
  ]

  return (
    <section className="bg-indigo-600 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:justify-around">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              {/* Bubble */}
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20 backdrop-blur-sm">
                <span className="text-2xl">{stat.icon}</span>
                <span className="mt-1 text-3xl font-extrabold leading-none text-white">
                  {formatNum(stat.value)}
                </span>
              </div>
              <span className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-indigo-300">{th.statsTagline}</p>
      </div>
    </section>
  )
}
