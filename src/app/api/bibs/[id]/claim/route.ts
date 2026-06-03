import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = Promise<{ id: string }>

export async function POST(req: Request, { params }: { params: Params }) {
  const { id: transferId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Load buyer athlete ──────────────────────────────────────────────────────
  const { data: buyer } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!buyer) {
    return NextResponse.json({ error: 'Athlete profile not found.' }, { status: 404 })
  }

  // ── Load transfer ───────────────────────────────────────────────────────────
  const { data: transfer } = await admin
    .from('bib_transfers')
    .select('id, registration_id, race_id, seller_id, transfer_type, status')
    .eq('id', transferId)
    .single()

  if (!transfer) {
    return NextResponse.json({ error: 'Transfer not found.' }, { status: 404 })
  }

  if (transfer.status !== 'available') {
    return NextResponse.json({ error: 'This bib is no longer available.' }, { status: 409 })
  }

  if (transfer.seller_id === buyer.id) {
    return NextResponse.json({ error: 'You cannot claim your own listing.' }, { status: 400 })
  }

  // ── Swap branch ─────────────────────────────────────────────────────────────
  if (transfer.transfer_type === 'swap') {
    const body = await req.json().catch(() => ({})) as { my_registration_id?: string }
    const { my_registration_id } = body

    if (!my_registration_id) {
      return NextResponse.json({ error: 'Provide my_registration_id for a swap.' }, { status: 400 })
    }

    // Verify buyer owns this registration
    const { data: myReg } = await admin
      .from('registrations')
      .select('id, race_id, athlete_id')
      .eq('id', my_registration_id)
      .eq('athlete_id', buyer.id)
      .single()

    if (!myReg) {
      return NextResponse.json({ error: 'Your registration not found or not yours.' }, { status: 404 })
    }

    // Both races must belong to the same event (and be different races)
    const { data: races } = await admin
      .from('races')
      .select('id, event_id')
      .in('id', [transfer.race_id, myReg.race_id])

    const sellerRace = races?.find(r => r.id === transfer.race_id)
    const buyerRace  = races?.find(r => r.id === myReg.race_id)

    if (!sellerRace?.event_id || !buyerRace?.event_id) {
      return NextResponse.json({ error: 'Swaps require both races to belong to a multi-distance event.' }, { status: 400 })
    }

    if (sellerRace.event_id !== buyerRace.event_id) {
      return NextResponse.json({ error: 'Both registrations must be in the same event.' }, { status: 400 })
    }

    if (sellerRace.id === buyerRace.id) {
      return NextResponse.json({ error: 'Cannot swap within the same race distance.' }, { status: 400 })
    }

    // Verify seller still owns their registration
    const { data: sellerReg } = await admin
      .from('registrations')
      .select('id, athlete_id')
      .eq('id', transfer.registration_id)
      .single()

    if (sellerReg?.athlete_id !== transfer.seller_id) {
      return NextResponse.json({ error: 'The seller no longer owns this registration.' }, { status: 409 })
    }

    // Atomic swap: update both registrations
    const [r1, r2] = await Promise.all([
      admin.from('registrations').update({ athlete_id: buyer.id }).eq('id', transfer.registration_id),
      admin.from('registrations').update({ athlete_id: transfer.seller_id }).eq('id', my_registration_id),
    ])

    if (r1.error || r2.error) {
      return NextResponse.json({ error: r1.error?.message ?? r2.error?.message }, { status: 500 })
    }

    // Mark transfer claimed
    await admin
      .from('bib_transfers')
      .update({ status: 'claimed', buyer_id: buyer.id, claimed_at: new Date().toISOString() })
      .eq('id', transferId)

    return NextResponse.json({ success: true })
  }

  // ── Gift / Sell branch ──────────────────────────────────────────────────────

  // Check buyer is not already registered for this race
  const { data: existingReg } = await admin
    .from('registrations')
    .select('id')
    .eq('race_id', transfer.race_id)
    .eq('athlete_id', buyer.id)
    .maybeSingle()

  if (existingReg) {
    return NextResponse.json({ error: 'You are already registered for this race.' }, { status: 409 })
  }

  const { error: regError } = await admin
    .from('registrations')
    .update({ athlete_id: buyer.id })
    .eq('id', transfer.registration_id)

  if (regError) {
    return NextResponse.json({ error: regError.message }, { status: 500 })
  }

  const { error: transferError } = await admin
    .from('bib_transfers')
    .update({ status: 'claimed', buyer_id: buyer.id, claimed_at: new Date().toISOString() })
    .eq('id', transferId)

  if (transferError) {
    console.error('Failed to mark transfer claimed:', transferError.message)
  }

  return NextResponse.json({ success: true })
}
