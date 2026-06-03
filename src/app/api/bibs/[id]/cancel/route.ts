import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = Promise<{ id: string }>

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id: transferId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Load seller athlete ─────────────────────────────────────────────────────
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete profile not found.' }, { status: 404 })
  }

  // ── Load transfer and verify ownership ─────────────────────────────────────
  const { data: transfer } = await admin
    .from('bib_transfers')
    .select('id, seller_id, status')
    .eq('id', transferId)
    .single()

  if (!transfer) {
    return NextResponse.json({ error: 'Transfer not found.' }, { status: 404 })
  }

  if (transfer.seller_id !== athlete.id) {
    return NextResponse.json({ error: 'Not your listing.' }, { status: 403 })
  }

  if (transfer.status !== 'available') {
    return NextResponse.json({ error: 'Listing is not active.' }, { status: 409 })
  }

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const { error } = await admin
    .from('bib_transfers')
    .update({ status: 'cancelled' })
    .eq('id', transferId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
