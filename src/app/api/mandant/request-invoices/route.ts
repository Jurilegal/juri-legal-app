import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { sessionIds } = await request.json()
  if (!sessionIds?.length) return NextResponse.json({ error: 'Keine Beratungen ausgewählt' }, { status: 400 })

  // Verify all sessions belong to user and are completed
  const { data: sessions } = await supabase.from('consultation_sessions')
    .select('id').eq('mandant_id', user.id).eq('status', 'completed').in('id', sessionIds)

  const validIds = (sessions || []).map(s => s.id)
  if (validIds.length === 0) return NextResponse.json({ error: 'Keine gültigen Beratungen' }, { status: 400 })

  // Create invoice request
  await supabase.from('invoice_requests').insert({
    user_id: user.id,
    session_ids: validIds,
  })

  // Create admin task
  await supabase.from('tasks').insert({
    title: `Rechnungsanforderung: ${validIds.length} Beratung(en)`,
    description: `Mandant fordert Rechnungen für ${validIds.length} Beratung(en) an.`,
    status: 'open',
    module: 'finance',
    related_entity_id: user.id,
    related_entity_type: 'invoice_request',
  })

  return NextResponse.json({ success: true, count: validIds.length })
}
