'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const PAGE_SIZE = 50

const months = [
  { value: 1, label: 'Januar' }, { value: 2, label: 'Februar' }, { value: 3, label: 'März' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Dezember' },
]

interface Session {
  id: string; mandant_id: string; mandant_name: string; type: string
  status: string; started_at: string | null; ended_at: string | null
  duration_seconds: number | null; created_at: string
}

export default function BeratungenPage() {
  const supabase = createClient()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString()
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString()

    const { count } = await supabase
      .from('consultation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('anwalt_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    setTotal(count || 0)

    const { data } = await supabase
      .from('consultation_sessions')
      .select('id, mandant_id, type, status, started_at, ended_at, duration_seconds, created_at')
      .eq('anwalt_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (!data || data.length === 0) { setSessions([]); setLoading(false); return }

    const ids = [...new Set(data.map(s => s.mandant_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', ids)
    const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]))

    setSessions(data.map(s => ({ ...s, mandant_name: pMap.get(s.mandant_id) || 'Unbekannt' })))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    completed: { label: 'Abgeschlossen', variant: 'success' },
    active: { label: 'Aktiv', variant: 'warning' },
    requested: { label: 'Angefragt', variant: 'neutral' },
    declined: { label: 'Abgelehnt', variant: 'error' },
    cancelled: { label: 'Abgebrochen', variant: 'error' },
  }

  // Generate year options (current year and 2 prior)
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-navy-800">Beratungen</h2>
        <div className="flex items-center gap-3">
          <select value={selectedMonth} onChange={e => { setSelectedMonth(Number(e.target.value)); setPage(0) }}
            className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); setPage(0) }}
            className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.open(`/api/lawyer/consultations/export?month=${selectedMonth}&year=${selectedYear}`, '_blank')}
            className="px-4 py-2 rounded-xl bg-navy-100 text-navy-700 hover:bg-navy-200 text-sm font-medium cursor-pointer">
            📥 CSV
          </button>
        </div>
      </div>

      <p className="text-sm text-navy-400">
        ⚠️ CSV-Export ist nur pro Monat möglich. Wählen Sie den gewünschten Monat oben aus.
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Keine Beratungen in diesem Monat.</p></Card>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map(s => {
              const st = statusMap[s.status] || { label: s.status, variant: 'neutral' as const }
              return (
                <Card key={s.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-800">{s.mandant_name}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <p className="text-sm text-navy-400 mt-1">
                        {s.type === 'chat' ? '💬 Chat' : '📹 Video'} ·{' '}
                        {s.started_at ? new Date(s.started_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(s.created_at).toLocaleDateString('de-DE')}
                        {s.duration_seconds ? ` · ${Math.ceil(s.duration_seconds / 60)} Min.` : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 rounded-lg text-sm bg-navy-100 text-navy-600 disabled:opacity-40 cursor-pointer">← Zurück</button>
              <span className="text-sm text-navy-400">Seite {page + 1} von {totalPages} ({total} Beratungen)</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg text-sm bg-navy-100 text-navy-600 disabled:opacity-40 cursor-pointer">Weiter →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
