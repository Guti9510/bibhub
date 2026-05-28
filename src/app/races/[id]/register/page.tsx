import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RegistrationForm from './_components/RegistrationForm'

type Params = Promise<{ id: string }>

export default async function RegisterPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/races/${id}/register`)
  }

  // Load athlete profile
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, email, phone')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!athlete) {
    redirect(`/dashboard/athlete/profile?next=/races/${id}/register`)
  }

  // Load race
  const { data: race } = await supabase
    .from('races')
    .select('*, organizers(name)')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!race) notFound()

  // Check if already registered
  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('race_id', id)
    .eq('athlete_id', athlete.id)
    .maybeSingle()

  if (existing) {
    redirect(`/races/${id}/register/success?rid=${existing.id}`)
  }

  return (
    <RegistrationForm
      raceId={id}
      raceName={race.name}
      raceDate={race.date}
      raceLocation={race.location}
      raceDistance={Number(race.distance)}
      raceSportType={race.sport_type}
      racePrice={Number(race.price)}
      hasWaves={race.has_waves}
      waveOptions={(race.wave_options as string[]) ?? []}
      shirtSizes={(race.shirt_sizes as string[]) ?? []}
      athleteName={`${athlete.first_name} ${athlete.last_name}`}
      athleteEmail={athlete.email}
      athletePhone={athlete.phone ?? ''}
    />
  )
}
