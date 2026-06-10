import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

type DistanceResult = {
  km: number
  label: string
  labelEs: string
  men: number
  women: number
  avgMen: string
  avgWomen: string
}

// ── Demo results ──────────────────────────────────────────────────────────────
// In production these would come from a race_results table.
// Keyed by event name so any future event can also get a stats page.
const DEMO_RESULTS: Record<string, DistanceResult[]> = {
  'Maratón San José': [
    { km: 5,    label: '5K',   labelEs: '5K',      men: 2100, women: 2100, avgMen: '28:45', avgWomen: '33:10'  },
    { km: 10,   label: '10K',  labelEs: '10K',     men: 1700, women: 1300, avgMen: '53:20', avgWomen: '1:02:40' },
    { km: 21.1, label: 'Half', labelEs: 'Media',   men: 1100, women: 700,  avgMen: '2:05:30', avgWomen: '2:22:15' },
    { km: 42.2, label: 'Full', labelEs: 'Maratón', men: 750,  women: 250,  avgMen: '4:28:00', avgWomen: '5:12:00' },
  ],
}

export default async function EventStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const locale = await getLocale()
  const t = getT(locale)
  const ts = t.raceStats
  const loc = locale === 'es' ? 'es-CR' : 'en-US'

  const { data: event } = await admin
    .from('events')
    .select('id, name, date, location, sport_type, status')
    .eq('id', id)
    .maybeSingle()

  if (!event) notFound()

  const results = DEMO_RESULTS[event.name] ?? null
  const dateObj = new Date(event.date)
  const dateStr = dateObj.toLocaleDateString(loc, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const totalMen     = results ? results.reduce((s, d) => s + d.men, 0) : 0
  const totalWomen   = results ? results.reduce((s, d) => s + d.women, 0) : 0
  const totalFinish  = totalMen + totalWomen
  const menPct       = totalFinish ? Math.round((totalMen   / totalFinish) * 100) : 0
  const womenPct     = 100 - menPct

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">{t.common.bibhub}</Link>
          <Link href="/races" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            {ts.backToCalendar}
          </Link>
        </div>
      </header>

      {/* ── Race hero ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
              🏃 {locale === 'es' ? 'Running' : 'Running'}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
              {ts.finalResults}
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{event.name}</h1>
          <p className="mt-2 text-gray-500">{dateStr} · {event.location}</p>

          {/* ── Summary circles ─────────────────────────────────────────────── */}
          {results && (
            <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
                <p className="text-4xl font-extrabold text-gray-900 tabular-nums">
                  {totalFinish.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {ts.totalFinishers}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
                <p className="text-4xl font-extrabold text-blue-700 tabular-nums">
                  {totalMen.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-blue-400">
                  {ts.men}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
                <p className="text-4xl font-extrabold text-rose-600 tabular-nums">
                  {totalWomen.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-rose-400">
                  {ts.women}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {results ? (
          <>
            {/* Distance breakdown */}
            <h2 className="mb-6 text-2xl font-bold text-gray-900">{ts.byDistance}</h2>

            <div className="space-y-4">
              {results.map(d => {
                const total  = d.men + d.women
                const menW   = Math.round((d.men   / total) * 100)
                const womenW = 100 - menW
                const pctOfAll = Math.round((total / totalFinish) * 100)
                const distLabel = locale === 'es' ? d.labelEs : d.label

                return (
                  <article key={d.km} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="p-6">
                      {/* Row 1: distance + totals */}
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-extrabold text-gray-900">{distLabel}</span>
                          <span className="text-xl font-semibold text-gray-400 tabular-nums">
                            {total.toLocaleString()}
                          </span>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                            {pctOfAll}% {ts.ofTotal}
                          </span>
                        </div>

                        {/* Gender detail */}
                        <div className="flex gap-5 text-sm">
                          <span className="flex items-center gap-1.5 font-medium text-blue-600">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                            ♂ {d.men.toLocaleString()}
                            <span className="ml-1 font-normal text-blue-400">{d.avgMen}</span>
                          </span>
                          <span className="flex items-center gap-1.5 font-medium text-rose-500">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                            ♀ {d.women.toLocaleString()}
                            <span className="ml-1 font-normal text-rose-400">{d.avgWomen}</span>
                          </span>
                        </div>
                      </div>

                      {/* Gender split bar */}
                      <div className="overflow-hidden rounded-full">
                        <div className="flex h-5">
                          <div
                            className="flex items-center justify-center bg-blue-500 text-[10px] font-bold text-white"
                            style={{ width: `${menW}%` }}
                          >
                            {menW > 15 ? `${menW}%` : ''}
                          </div>
                          <div
                            className="flex items-center justify-center bg-rose-400 text-[10px] font-bold text-white"
                            style={{ width: `${womenW}%` }}
                          >
                            {womenW > 15 ? `${womenW}%` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Overall gender split */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900">{ts.overallSplit}</h3>

              <div className="mb-3 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {ts.men} {menPct}%
                  </span>
                  <span className="text-sm text-gray-400">({totalMen.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="text-sm font-semibold text-gray-700">
                    {ts.women} {womenPct}%
                  </span>
                  <span className="text-sm text-gray-400">({totalWomen.toLocaleString()})</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-full">
                <div className="flex h-10">
                  <div
                    className="flex items-center justify-center bg-blue-500 text-sm font-bold text-white"
                    style={{ width: `${menPct}%` }}
                  >
                    {menPct}%
                  </div>
                  <div
                    className="flex items-center justify-center bg-rose-400 text-sm font-bold text-white"
                    style={{ width: `${womenPct}%` }}
                  >
                    {womenPct}%
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-5xl">⏱️</p>
            <p className="mt-4 text-xl font-semibold text-gray-900">{ts.resultsComingSoon}</p>
            <p className="mt-2 text-gray-500">{ts.resultsComingSoonDesc}</p>
            <Link href="/races" className="mt-6 text-sm font-semibold text-indigo-600 hover:underline">
              {ts.backToCalendar}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
