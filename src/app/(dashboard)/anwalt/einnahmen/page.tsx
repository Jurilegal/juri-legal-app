'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'

interface EarningRow {
  id: string
  session_id: string
  amount_captured: number | null
  platform_fee: number | null
  duration_seconds: number | null
  minute_rate: number
  status: string
  created_at: string
  mandant_name: string
}

export default function EinnahmenPage() {
  const supabase = createClient()
  const [earnings, setEarnings] = useState<EarningRow[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ gross: 0, fee: 0, net: 0, sessions: 0, minutes: 0 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: payments } = await supabase
        .from('session_payments')
        .select('*, consultation_sessions(mandant_id)')
        .eq('anwalt_id', user.id)
        .order('created_at', { ascending: false })

      if (!payments || payments.length === 0) { setLoading(false); return }

      const mandantIds = payments.map(p => {
        const cs = p.consultation_sessions as unknown as { mandant_id: string }
        return cs?.mandant_id
      }).filter(Boolean)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', mandantIds)

      const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`]))

      let gross = 0, fee = 0, totalMin = 0, captured = 0
      const rows = payments.map(p => {
        const cs = p.consultation_sessions as unknown as { mandant_id: string }
        if (p.status === 'captured' && p.amount_captured) {
          gross += p.amount_captured
          fee += p.platform_fee || 0
          captured++
          totalMin += Math.ceil((p.duration_seconds || 0) / 60)
        }
        return {
          ...p,
          mandant_name: pMap.get(cs?.mandant_id) || 'Unbekannt',
        }
      })

      setEarnings(rows)
      setTotals({ gross, fee, net: gross - fee, sessions: captured, minutes: totalMin })
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="text-center py-12 text-navy-400">Laden...</div>

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Brutto-Einnahmen', value: `${(totals.gross / 100).toFixed(2)} €`, icon: '💰' },
          { label: 'Plattformgebühr (5%)', value: `${(totals.fee / 100).toFixed(2)} €`, icon: '📊' },
          { label: 'Netto-Einnahmen', value: `${(totals.net / 100).toFixed(2)} €`, icon: '🏦' },
          { label: 'Beratungen / Min.', value: `${totals.sessions} / ${totals.minutes}`, icon: '⏱️' },
        ].map(s => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-400">{s.label}</p>
                <p className="text-xl font-bold text-navy-900 mt-1">{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-xl font-bold text-navy-800 mb-4">Transaktionen</h2>
        {earnings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-navy-400">Noch keine Einnahmen.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {earnings.map(e => (
              <Card key={e.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy-800">{e.mandant_name}</p>
                    <p className="text-sm text-navy-400">
                      {e.duration_seconds ? `${Math.ceil(e.duration_seconds / 60)} Min.` : '–'} &middot;{' '}
                      {(e.minute_rate / 100).toFixed(2)} €/Min. &middot;{' '}
                      {new Date(e.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy-900">
                      {e.amount_captured ? `${((e.amount_captured - (e.platform_fee || 0)) / 100).toFixed(2)} €` : '–'}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      e.status === 'captured' ? 'bg-emerald-50 text-emerald-700' :
                      e.status === 'authorized' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {e.status === 'captured' ? 'Abgeschlossen' : e.status === 'authorized' ? 'Ausstehend' : e.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
