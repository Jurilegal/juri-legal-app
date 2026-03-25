'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PayoutRow {
  id: string
  anwalt_id: string
  period_start: string
  period_end: string
  gross_amount: number
  platform_fee: number
  net_amount: number
  session_count: number
  status: string
  anwalt_name: string
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  pending: { label: 'Ausstehend', variant: 'warning' },
  accepted: { label: 'Akzeptiert', variant: 'success' },
  invoice_requested: { label: 'Rechnung angefordert', variant: 'warning' },
  paid: { label: 'Bezahlt', variant: 'success' },
  disputed: { label: 'Beanstandet', variant: 'error' },
}

export default function AuszahlungenPage() {
  const supabase = createClient()
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('payout_periods')
        .select('*')
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) { setLoading(false); return }

      const ids = [...new Set(data.map(p => p.anwalt_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', ids)

      const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`]))

      setPayouts(data.map(p => ({ ...p, anwalt_name: pMap.get(p.anwalt_id) || 'Unbekannt' })))
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markAsPaid(id: string) {
    await supabase.from('payout_periods').update({ status: 'paid' }).eq('id', id)
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p))
  }

  if (loading) return <div className="text-center py-12 text-navy-400">Laden...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Auszahlungen</h2>

      {payouts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-navy-400">Noch keine Auszahlungsperioden.</p>
          <p className="text-sm text-navy-300 mt-1">Auszahlungen werden am Monatsende automatisch erstellt.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payouts.map(p => {
            const st = statusMap[p.status] || statusMap.pending
            return (
              <Card key={p.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{p.anwalt_name}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-navy-400 mt-1">
                      {new Date(p.period_start).toLocaleDateString('de-DE')} – {new Date(p.period_end).toLocaleDateString('de-DE')}
                      {' · '}{p.session_count} Beratungen
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-navy-900">{(p.net_amount / 100).toFixed(2)} €</p>
                      <p className="text-xs text-navy-400">Brutto: {(p.gross_amount / 100).toFixed(2)} €</p>
                    </div>
                    {p.status === 'invoice_requested' && (
                      <Button variant="primary" size="sm" onClick={() => markAsPaid(p.id)}>
                        Als bezahlt markieren
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
