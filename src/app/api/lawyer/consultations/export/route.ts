import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const url = new URL(request.url)
  const month = parseInt(url.searchParams.get('month') || '')
  const year = parseInt(url.searchParams.get('year') || '')

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Monat und Jahr sind erforderlich (month=1-12, year=YYYY)' }, { status: 400 })
  }

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data: sessions } = await supabase
    .from('consultation_sessions')
    .select('id, mandant_id, started_at, ended_at, duration_seconds, status')
    .eq('anwalt_id', user.id)
    .eq('status', 'completed')
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: true })

  if (!sessions?.length) {
    return NextResponse.json({ error: 'Keine Beratungen in diesem Zeitraum' }, { status: 404 })
  }

  // Get payments
  const sessionIds = sessions.map(s => s.id)
  const { data: payments } = await supabase
    .from('session_payments')
    .select('session_id, amount_captured, platform_fee')
    .in('session_id', sessionIds)
    .eq('status', 'captured')

  const payMap = new Map((payments || []).map(p => [p.session_id, p]))

  // Build CSV
  const header = 'session_id,mandant_id,start_time,end_time,duration_minutes,revenue_eur\n'
  const rows = sessions.map(s => {
    const pay = payMap.get(s.id)
    const revenue = pay ? ((pay.amount_captured - (pay.platform_fee || 0)) / 100).toFixed(2) : '0.00'
    const duration = s.duration_seconds ? Math.ceil(s.duration_seconds / 60) : 0
    return `${s.id},${s.mandant_id},${s.started_at || ''},${s.ended_at || ''},${duration},${revenue}`
  }).join('\n')

  const csv = header + rows

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="beratungen_${year}-${month.toString().padStart(2, '0')}.csv"`,
    },
  })
}
