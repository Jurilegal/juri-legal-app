import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from und to erforderlich' }, { status: 400 })

  // Get time entries
  const { data: entries } = await supabase.from('time_entries')
    .select('*, cases(title, reference_number)')
    .eq('user_id', user.id).gte('date', from).lte('date', to)
    .order('date')

  if (!entries?.length) {
    return new Response('Keine Daten im gewählten Zeitraum.', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  // DATEV Buchungsstapel header
  const header = 'Umsatz (ohne Soll/Haben-Kz);Soll/Haben-Kennzeichen;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schlüssel);BU-Schlüssel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext\n'

  const rows = entries.map(e => {
    const cases = e.cases as { title: string; reference_number: string | null } | null
    const amount = ((e.duration_minutes / 60) * (e.hourly_rate || 250)).toFixed(2)
    const dateStr = new Date(e.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    const text = `${e.description}${cases?.reference_number ? ` (${cases.reference_number})` : ''}`
    return `${amount};S;EUR;;;;8400;10000;;${dateStr};;;0;${text}`
  }).join('\n')

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="DATEV-Export-${from}-${to}.csv"`,
    },
  })
}
