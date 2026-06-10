import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import RaceSpotlightModal from './RaceSpotlightModal'

// Must stay in sync with DEMO_RESULTS in /app/events/[id]/stats/page.tsx
const SPOTLIGHT_STATS: Record<string, { finishers: number; men: number; women: number }> = {
  'Maratón San José': { finishers: 10_000, men: 5_650, women: 4_350 },
}

export default async function RaceSpotlight() {
  const admin  = createAdminClient()
  const locale = await getLocale()
  const t      = getT(locale)
  const th     = t.home
  const ts     = t.raceStats

  // Latest completed event
  const { data: event } = await admin
    .from('events')
    .select('id, name, date, location')
    .eq('status', 'closed')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!event) return null

  const stats = SPOTLIGHT_STATS[event.name]
  if (!stats) return null

  return (
    <RaceSpotlightModal
      event={{ id: event.id, name: event.name, location: event.location, ...stats }}
      locale={locale}
      spotlightBadge={th.spotlightBadge}
      spotlightCta={th.spotlightCta}
      spotlightDismiss={th.spotlightDismiss}
      men={ts.men}
      women={ts.women}
      finishersLabel={ts.totalFinishers}
    />
  )
}
