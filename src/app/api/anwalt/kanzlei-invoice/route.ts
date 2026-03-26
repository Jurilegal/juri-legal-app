import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id und status erforderlich' }, { status: 400 })

  const valid = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
  if (!valid.includes(status)) return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 })

  const { error } = await supabase.from('kanzlei_invoices').update({ status }).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
