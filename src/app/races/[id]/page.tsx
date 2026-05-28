import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const SPORT_META: Record<string, { emoji: string; label: string; color: string }> = {
  running:  { emoji: '🏃', label: 'Running',  color: 'bg-orange-50 text-orange-700 border-orange-200' },
  cycling:  { emoji: '🚴', label: 'Cycling',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  swimming: { emoji: '🏊', label: 'Swimming', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
}

type Params = Promise<{ id: string }>

export default async function RaceDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: race } = await supabase
    .from('races')
    .select('*, organizers(name, email)')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!race) notFound()

  const meta = SPORT_META[race.sport_type] ?? SPORT_META.running
  const raceDate = new Date(race.date)
  const organizer = race.organizers as unknown as { name: string; email: string } | null
  const waveOptions = race.wave_options as string[]
  const shirtSizes = race.shirt_sizes as string[]
  const isFree = Number(race.price) === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">BibHub</Link>
          <Link href="/races" className="text-sm text-gray-500 hover:text-gray-900">
            ← All races
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Left: race info ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title */}
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                {meta.emoji} {meta.label}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-gray-900">{race.name}</h1>
              {organizer && (
                <p className="mt-1 text-sm text-gray-500">
                  Organized by <span className="font-medium text-gray-700">{organizer.name}</span>
                </p>
              )}
            </div>

            {/* Key details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Race details</h2>
              <dl className="space-y-4">
                <DetailRow
                  icon={<CalendarIcon />}
                  label="Date"
                  value={raceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <DetailRow
                  icon={<ClockIcon />}
                  label="Start time"
                  value={raceDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                />
                <DetailRow
                  icon={<LocationIcon />}
                  label="Location"
                  value={race.location}
                />
                <DetailRow
                  icon={<DistanceIcon />}
                  label="Distance"
                  value={`${race.distance} km`}
                />
              </dl>
            </div>

            {/* Waves */}
            {race.has_waves && waveOptions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Start waves</h2>
                <div className="flex flex-wrap gap-2">
                  {waveOptions.map((wave, i) => (
                    <span key={wave} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      {wave}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Shirt sizes */}
            {shirtSizes.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Shirt sizes available
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
          </div>

          {/* ── Right: registration card ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {isFree ? 'Free' : `$${Number(race.price).toFixed(2)}`}
                </p>
                <p className="mt-1 text-sm text-gray-400">per registration</p>
              </div>

              {race.max_participants && (
                <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{race.max_participants}</p>
                  <p className="text-xs text-gray-400">maximum participants</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {waveOptions.length > 0 && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <span className="text-indigo-500">✓</span>
                    {waveOptions.length} start {waveOptions.length === 1 ? 'wave' : 'waves'}
                  </p>
                )}
                {shirtSizes.length > 0 && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <span className="text-indigo-500">✓</span>
                    Shirt size selection
                  </p>
                )}
              </div>

              <Link
                href={`/races/${race.id}/register`}
                className="mt-6 block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors"
              >
                Register now
              </Link>

              <p className="mt-3 text-center text-xs text-gray-400">
                Registration managed by BibHub
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
