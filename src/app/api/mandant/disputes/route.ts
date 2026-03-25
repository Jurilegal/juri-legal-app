import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { sessionId, reason, requestedAmount } = await request.json()
  if (!sessionId || !reason || !requestedAmount) {
    return NextResponse.json({ error: 'Alle Felder erforderlich' }, { status: 400 })
  }

  // Verify session belongs to mandant and is completed
  const { data: session } = await supabase.from('consultation_sessions')
    .select('id, anwalt_id, ended_at, status')
    .eq('id', sessionId).eq('mandant_id', user.id).single()

  if (!session || session.status !== 'completed') {
    return NextResponse.json({ error: 'Beratung nicht gefunden oder nicht abgeschlossen' }, { status: 404 })
  }

  // Check 3-day window
  const endedAt = new Date(session.ended_at!).getTime()
  if (Date.now() - endedAt > 3 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Die 3-Tages-Frist für Disputen ist abgelaufen' }, { status: 400 })
  }

  // Check no existing dispute
  const { data: existing } = await supabase.from('disputes').select('id').eq('session_id', sessionId).limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Es existiert bereits ein Disput für diese Beratung' }, { status: 400 })
  }

  const lawyerToken = crypto.randomBytes(32).toString('hex')

  // Create dispute
  const { data: dispute, error } = await supabase.from('disputes').insert({
    session_id: sessionId,
    mandant_id: user.id,
    anwalt_id: session.anwalt_id,
    reason,
    requested_amount: requestedAmount,
    lawyer_token: lawyerToken,
    timeline: [{ action: 'created', by: user.id, at: new Date().toISOString(), note: reason }],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create admin task
  await supabase.from('tasks').insert({
    title: `Disput: Rückerstattung ${requestedAmount} €`,
    description: `Mandant beantragt Rückerstattung.\n\nGrund: ${reason}\nBetrag: ${requestedAmount} €`,
    status: 'open',
    module: 'accounts',
    related_entity_id: dispute.id,
    related_entity_type: 'dispute',
  })

  return NextResponse.json({ success: true, disputeId: dispute.id })
}
