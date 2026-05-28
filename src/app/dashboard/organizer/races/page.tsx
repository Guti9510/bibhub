import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Races</h1>
        <Link
          href="/dashboard/organizer/races/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + New race
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
                <StatusBadge status={race.status} />
              </div>
              <h3 className="font-semibold text-gray-900">{race.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{race.location}</p>
              <p className="mt-1 text-sm text-gray-500">{new Date(race.date).toLocaleDateString()}</p>
              <p className="mt-3 text-sm font-medium text-gray-700">${race.price} · {race.distance} km</p>
            </div>
          </Link>
        ))}

        {!races?.length && (
          <p className="col-span-full text-sm text-gray-400">No races yet.</p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? ''}`}>
      {status}
    </span>
  )
}
