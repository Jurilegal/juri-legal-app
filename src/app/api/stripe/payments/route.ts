import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: payments } = await supabase
    .from('session_payments')
    .select('id, session_id, amount_captured, minute_rate, duration_seconds, platform_fee, status, created_at')
    .eq('mandant_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ payments: payments || [] })
}
