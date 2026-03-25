'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PAGE_SIZE = 50
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

interface Session {
  id: string; anwalt_id: string; anwalt_name: string; type: string
  status: string; started_at: string | null; ended_at: string | null
  duration_seconds: number | null; created_at: string; has_review: boolean
  has_dispute: boolean; invoice_requested: boolean
}

export default function MandantBeratungenPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Dispute modal
  const [disputeModal, setDisputeModal] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeAmount, setDisputeAmount] = useState('')
  const [disputeSending, setDisputeSending] = useState(false)

  // Invoice
  const [invoicing, setInvoicing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase.from('consultation_sessions')
      .select('*', { count: 'exact', head: true }).eq('mandant_id', user.id)
    setTotal(count || 0)

    const { data } = await supabase.from('consultation_sessions')
      .select('id, anwalt_id, type, status, started_at, ended_at, duration_seconds, created_at')
      .eq('mandant_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (!data?.length) { setSessions([]); setLoading(false); return }

    const anwaltIds = [...new Set(data.map(s => s.anwalt_id))]
    const sessionIds = data.map(s => s.id)

    const [{ data: profiles }, { data: reviews }, { data: disputes }, { data: invoices }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').in('id', anwaltIds),
      supabase.from('reviews').select('session_id').in('session_id', sessionIds),
      supabase.from('disputes').select('session_id').in('session_id', sessionIds),
      supabase.from('invoice_requests').select('session_ids').eq('user_id', user.id),
    ])

    const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]))
    const reviewSet = new Set((reviews || []).map(r => r.session_id))
    const disputeSet = new Set((disputes || []).map(d => d.session_id))
    const invoicedIds = new Set<string>()
    ;(invoices || []).forEach(inv => {
      const ids = inv.session_ids as string[]
      ids?.forEach(id => invoicedIds.add(id))
    })

    setSessions(data.map(s => ({
      ...s,
      anwalt_name: pMap.get(s.anwalt_id) || 'Anwalt',
      has_review: reviewSet.has(s.id),
      has_dispute: disputeSet.has(s.id),
      invoice_requested: invoicedIds.has(s.id),
    })))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => { load() }, [load])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function selectAll() {
    const completedIds = sessions.filter(s => s.status === 'completed').map(s => s.id)
    setSelected(prev => prev.size === completedIds.length ? new Set() : new Set(completedIds))
  }

  async function requestInvoices(ids: string[]) {
    setInvoicing(true)
    const res = await fetch('/api/mandant/request-invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds: ids }),
    })
    if (res.ok) {
      setSessions(prev => prev.map(s => ids.includes(s.id) ? { ...s, invoice_requested: true } : s))
      setSelected(new Set())
    }
    setInvoicing(false)
  }

  async function submitDispute() {
    if (!disputeModal || !disputeReason.trim() || !disputeAmount) return
    setDisputeSending(true)
    const res = await fetch('/api/mandant/disputes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: disputeModal, reason: disputeReason, requestedAmount: parseFloat(disputeAmount) }),
    })
    if (res.ok) {
      setSessions(prev => prev.map(s => s.id === disputeModal ? { ...s, has_dispute: true } : s))
    }
    setDisputeModal(null); setDisputeReason(''); setDisputeAmount('')
    setDisputeSending(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    completed: { label: 'Abgeschlossen', variant: 'success' },
    active: { label: 'Aktiv', variant: 'warning' },
    requested: { label: 'Angefragt', variant: 'neutral' },
    declined: { label: 'Abgelehnt', variant: 'error' },
    cancelled: { label: 'Abgebrochen', variant: 'error' },
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-navy-800">Meine Beratungen</h2>
        {selected.size > 0 && (
          <Button variant="primary" size="sm" onClick={() => requestInvoices([...selected])} loading={invoicing}>
            📄 Rechnung für {selected.size} Beratung(en) anfordern
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Noch keine Beratungen.</p></Card>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" onChange={selectAll} checked={selected.size === sessions.filter(s => s.status === 'completed').length && selected.size > 0}
              className="w-4 h-4 rounded border-navy-300 cursor-pointer" />
            <span className="text-sm text-navy-400">Alle abgeschlossenen auswählen</span>
          </div>

          <div className="space-y-3">
            {sessions.map(s => {
              const st = statusMap[s.status] || { label: s.status, variant: 'neutral' as const }
              const endedAt = s.ended_at ? new Date(s.ended_at).getTime() : 0
              const canDispute = s.status === 'completed' && !s.has_dispute && (Date.now() - endedAt) < THREE_DAYS_MS

              return (
                <Card key={s.id} className="p-5">
                  <div className="flex items-start gap-3">
                    {s.status === 'completed' && (
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)}
                        className="mt-1 w-4 h-4 rounded border-navy-300 cursor-pointer" />
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-navy-800">{s.anwalt_name}</span>
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </div>
                          <p className="text-sm text-navy-400 mt-1">
                            {s.type === 'chat' ? '💬 Chat' : '📹 Video'} ·{' '}
                            {s.started_at ? new Date(s.started_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(s.created_at).toLocaleDateString('de-DE')}
                            {s.duration_seconds ? ` · ${Math.ceil(s.duration_seconds / 60)} Min.` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.status === 'completed' && !s.has_review && (
                            <a href={`/beratung/${s.id}`} className="text-xs px-3 py-1.5 rounded-lg bg-gold-50 text-gold-700 border border-gold-200 hover:bg-gold-100">⭐ Bewerten</a>
                          )}
                          {canDispute && (
                            <button onClick={() => setDisputeModal(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer">⚠️ Disput</button>
                          )}
                          {s.has_dispute && (
                            <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">Disput eingereicht</span>
                          )}
                          {s.status === 'completed' && !s.invoice_requested && (
                            <button onClick={() => requestInvoices([s.id])} className="text-xs px-3 py-1.5 rounded-lg bg-navy-50 text-navy-600 border border-navy-200 hover:bg-navy-100 cursor-pointer">📄 Rechnung</button>
                          )}
                          {s.invoice_requested && (
                            <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600">✓ Rechnung angefordert</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 rounded-lg text-sm bg-navy-100 text-navy-600 disabled:opacity-40 cursor-pointer">← Zurück</button>
              <span className="text-sm text-navy-400">Seite {page + 1} von {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg text-sm bg-navy-100 text-navy-600 disabled:opacity-40 cursor-pointer">Weiter →</button>
            </div>
          )}
        </>
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-navy-800 mb-3">Disput einreichen</h3>
            <p className="text-sm text-navy-400 mb-4">Schildern Sie den Vorfall. Sie haben 3 Tage nach der Beratung Zeit.</p>
            <div className="space-y-3">
              <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Beschreibung des Problems *"
                rows={3} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm resize-y" />
              <div>
                <label className="text-sm text-navy-400 block mb-1">Gewünschter Rückerstattungsbetrag (€)</label>
                <input type="number" step="0.01" min="0" value={disputeAmount} onChange={e => setDisputeAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-navy-200 text-sm w-40" />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={submitDispute} loading={disputeSending}
                  disabled={!disputeReason.trim() || !disputeAmount}>Disput einreichen</Button>
                <Button variant="outline" size="sm" onClick={() => { setDisputeModal(null); setDisputeReason(''); setDisputeAmount('') }}>Abbrechen</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
