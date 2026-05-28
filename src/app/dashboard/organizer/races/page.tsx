import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

export default async function RacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('organizer_id', organizer?.id ?? '')
    .order('date', { ascending: true })

  const locale = await getLocale()
  const t = getT(locale)
  const to = t.organizerRaces
  const statusLabels = t.organizerDashboard.statusLabels

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{to.title}</h1>
        <Link
          href="/dashboard/organizer/races/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {to.newRace}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {races?.map(race => (
          <Link key={race.id} href={`/dashboard/organizer/races/${race.id}`}>
            <div className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                  {race.sport_type}
                </span>
                <StatusBadge status={race.status} label={statusLabels[race.status as keyof typeof statusLabels] ?? race.status} />
              </div>
              <h3 className="font-semibold text-gray-900">{race.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{race.location}</p>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(race.date).toLocaleDateString(locale === 'es' ? 'es-CR' : 'en-US')}
              </p>
              <p className="mt-3 text-sm font-medium text-gray-700">${race.price} · {race.distance} km</p>
            </div>
          </Link>
        ))}

        {!races?.length && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <p className="font-medium text-gray-900">{to.noRacesYet}</p>
            <p className="mt-1 text-sm text-gray-400">{to.createFirstRace}</p>
            <Link
              href="/dashboard/organizer/races/new"
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {to.createARace}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? ''}`}>
      {label}
    </span>
  )
}
