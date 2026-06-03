import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Body ────────────────────────────────────────────────────────────────────
  const body = await req.json() as {
    registration_id?: string
    transfer_type?: string
    asking_price?: number | null
    message?: string | null
  }

  const { registration_id, transfer_type, asking_price, message } = body

  if (!registration_id || !transfer_type) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (!['sell', 'swap', 'gift'].includes(transfer_type)) {
    return NextResponse.json({ error: 'Invalid transfer type.' }, { status: 400 })
  }

  if (transfer_type === 'sell' && (!asking_price || asking_price <= 0)) {
    return NextResponse.json({ error: 'A price is required for sell listings.' }, { status: 400 })
  }

  // ── Verify athlete owns this registration ───────────────────────────────────
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete profile not found.' }, { status: 404 })
  }

  const { data: registration } = await supabase
    .from('registrations')
    .select('id, race_id, athlete_id')
    .eq('id', registration_id)
    .eq('athlete_id', athlete.id)
    .single()

  if (!registration) {
    return NextResponse.json({ error: 'Registration not found or not yours.' }, { status: 404 })
  }

  // ── Check for existing active listing ──────────────────────────────────────
  const { data: existing } = await admin
    .from('bib_transfers')
    .select('id')
    .eq('registration_id', registration_id)
    .eq('status', 'available')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This bib already has an active listing.' }, { status: 409 })
  }

  // ── Create listing ──────────────────────────────────────────────────────────
  const { data: transfer, error: insertError } = await admin
    .from('bib_transfers')
    .insert({
      registration_id,
      race_id: registration.race_id,
      seller_id: athlete.id,
      transfer_type,
      asking_price: transfer_type === 'sell' ? asking_price : null,
      message: message || null,
      status: 'available',
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: transfer.id })
}
