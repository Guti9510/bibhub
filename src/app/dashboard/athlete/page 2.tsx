import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AthleteOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, races(name, date, location, sport_type, distance)')
    .eq('athlete_id', athlete?.id ?? '')
    .order('registered_at', { ascending: false })

  const upcoming = registrations?.filter(r => {
    const raceDate = (r.races as unknown as { date: string } | null)?.date
    return raceDate && new Date(raceDate) >= new Date()
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Welcome to BibHub'}
          </h1>
          {athlete && <p className="mt-1 text-sm text-gray-500">{athlete.email}</p>}
        </div>
        {!athlete && (
          <Link href="/dashboard/athlete/profile" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Complete profile
          </Link>
        )}
      </div>

      {!athlete && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Please complete your athlete profile before registering for races.
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4">
        <StatCard label="Upcoming races" value={upcoming?.length ?? 0} />
        <StatCard label="Total registrations" value={registrations?.length ?? 0} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Recent registrations</h2>
        </div>
        {!registrations?.length ? (
          <p className="px-6 py-8 text-sm text-gray-400">
            No registrations yet.{' '}
            <Link href="/races" className="text-indigo-600 hover:underline">Browse races</Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-6 py-3 font-medium">Race</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registrations.map(reg => {
                const race = reg.races as unknown as { name: string; date: string } | null
                return (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{race?.name}</td>
                    <td className="px-6 py-3 text-gray-500">{race?.date ? new Date(race.date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3">
                      <PaymentBadge status={reg.payment_status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    refunded: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? ''}`}>
      {status}
    </span>
  )
}
