import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

export default async function RegistrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, races(name, date, location, sport_type, distance, price)')
    .eq('athlete_id', athlete?.id ?? '')
    .order('registered_at', { ascending: false })

  const locale = await getLocale()
  const t = getT(locale)
  const ta = t.athleteDashboard
  const tr = t.registration

  const sportLabel = (s: string) => {
    if (locale === 'es') {
      return { running: 'Running', cycling: 'Ciclismo', swimming: 'Natación' }[s] ?? s
    }
    return s
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t.sidebar.myRegistrations}</h1>

      <div className="space-y-4">
        {registrations?.map(reg => {
          const race = reg.races as unknown as {
            name: string; date: string; location: string
            sport_type: string; distance: number; price: number
          } | null

          return (
            <div key={reg.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{race?.name}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {race?.location} · {race?.date ? new Date(race.date).toLocaleDateString(locale === 'es' ? 'es-CR' : 'en-US') : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500 capitalize">
                    {race?.sport_type ? sportLabel(race.sport_type) : ''} · {race?.distance} km
                  </p>
                </div>
                <PaymentBadge
                  status={reg.payment_status}
                  label={ta.paymentStatus[reg.payment_status as keyof typeof ta.paymentStatus] ?? reg.payment_status}
                />
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                {reg.wave && <span>{tr.waveName}: <strong className="text-gray-600">{reg.wave}</strong></span>}
                {reg.shirt_size && <span>{tr.shirtSizeName}: <strong className="text-gray-600">{reg.shirt_size}</strong></span>}
                {reg.expected_finish_time && <span>{tr.finishTime}: <strong className="text-gray-600">{reg.expected_finish_time}</strong></span>}
              </div>
            </div>
          )
        })}

        {!registrations?.length && (
          <p className="text-sm text-gray-400">
            {ta.noRegistrationsYet}{' '}
            <Link href="/races" className="text-indigo-600 hover:underline">{ta.browseRaces}</Link>
          </p>
        )}
      </div>
    </div>
  )
}

function PaymentBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    refunded: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? ''}`}>
      {label}
    </span>
  )
}
