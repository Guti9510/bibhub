import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function OrganizerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!organizer) redirect('/auth/login')

  // Fetch all races for this organizer
  const { data: races } = await supabase
    .from('races')
    .select('id, name, date, location, sport_type, status, price, max_participants')
    .eq('organizer_id', organizer.id)
    .order('date', { ascending: false })

  const raceIds = races?.map(r => r.id) ?? []

  // Fetch registrations for those races (two columns only — fast)
  let registrations: { race_id: string; payment_status: string }[] = []
  if (raceIds.length > 0) {
    const { data } = await supabase
      .from('registrations')
      .select('race_id, payment_status')
      .in('race_id', raceIds)
    registrations = data ?? []
  }

  // Build per-race stats
  const statsByRace = new Map<string, { total: number; paid: number }>()
  for (const reg of registrations) {
    const s = statsByRace.get(reg.race_id) ?? { total: 0, paid: 0 }
    s.total++
    if (reg.payment_status === 'paid') s.paid++
    statsByRace.set(reg.race_id, s)
  }

  // Aggregate stats
  const totalRegistrations = registrations.length
  const totalRevenue = (races ?? []).reduce((sum, race) => {
    const s = statsByRace.get(race.id)
    return sum + (s?.paid ?? 0) * Number(race.price)
  }, 0)
  const publishedCount = (races ?? []).filter(r => r.status === 'published').length
  const draftCount = (races ?? []).filter(r => r.status === 'draft').length

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {organizer.name}
          </p>
        </div>
        <Link
          href="/dashboard/organizer/races/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Race
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total races"
          value={String(races?.length ?? 0)}
          sub={`${publishedCount} published · ${draftCount} draft`}
          icon={<RaceIcon />}
          color="indigo"
        />
        <StatCard
          label="Total registrations"
          value={String(totalRegistrations)}
          sub="across all events"
          icon={<PeopleIcon />}
          color="violet"
        />
        <StatCard
          label="Total revenue"
          value={fmt.format(totalRevenue)}
          sub="from paid registrations"
          icon={<RevenueIcon />}
          color="emerald"
        />
        <StatCard
          label="Published races"
          value={String(publishedCount)}
          sub={`${draftCount} still in draft`}
          icon={<CheckIcon />}
          color="sky"
        />
      </div>

      {/* Race table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Your races</h2>
          {races && races.length > 0 && (
            <Link
              href="/dashboard/organizer/races"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {!races?.length ? (
          <EmptyRaces />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Race</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Date</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Registrations</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Revenue</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {races.map(race => {
                  const stats = statsByRace.get(race.id) ?? { total: 0, paid: 0 }
                  const raceRevenue = stats.paid * Number(race.price)
                  const capacity = race.max_participants
                    ? Math.round((stats.total / race.max_participants) * 100)
                    : null

                  return (
                    <tr key={race.id} className="group hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold capitalize text-indigo-600">
                            {race.sport_type.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <Link
                              href={`/dashboard/organizer/races/${race.id}`}
                              className="font-medium text-gray-900 hover:text-indigo-600"
                            >
                              {race.name}
                            </Link>
                            <p className="text-xs text-gray-400">{race.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(race.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={race.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">{stats.total}</span>
                        {capacity !== null && (
                          <span className="ml-1 text-xs text-gray-400">/ {race.max_participants}</span>
                        )}
                        {capacity !== null && (
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-indigo-400"
                              style={{ width: `${Math.min(capacity, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {fmt.format(raceRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/organizer/races/${race.id}`}
                          className="text-xs font-medium text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-indigo-600"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  color: 'indigo' | 'violet' | 'emerald' | 'sky'
}) {
  const bg: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status === 'published' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
      )}
      {status}
    </span>
  )
}

function EmptyRaces() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
        <RaceIcon />
      </div>
      <p className="font-medium text-gray-900">No races yet</p>
      <p className="mt-1 text-sm text-gray-400">Create your first race to start collecting registrations.</p>
      <Link
        href="/dashboard/organizer/races/new"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create a race
      </Link>
    </div>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function RaceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  )
}
function PeopleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function RevenueIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
