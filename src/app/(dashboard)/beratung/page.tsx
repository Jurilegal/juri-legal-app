'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

type TabKey = 'active' | 'completed' | 'all'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Aktiv' },
  { key: 'completed', label: 'Abgeschlossen' },
  { key: 'all', label: 'Alle' },
]

const statusLabels: Record<string, { label: string; variant: 'success' | 'neutral' | 'warning' | 'error' }> = {
  requested: { label: 'Angefragt', variant: 'warning' },
  accepted: { label: 'Angenommen', variant: 'success' },
  active: { label: 'Aktiv', variant: 'success' },
  completed: { label: 'Abgeschlossen', variant: 'neutral' },
  declined: { label: 'Abgelehnt', variant: 'error' },
  cancelled: { label: 'Abgebrochen', variant: 'error' },
}

interface SessionRow {
  id: string
  status: string
  type: string
  created_at: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  other_name: string
  other_role: string
}

export default function BeratungenPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<TabKey>('active')
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = profile?.role || 'mandant'

      let query = supabase
        .from('consultation_sessions')
        .select('*')
        .or(`mandant_id.eq.${user.id},anwalt_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (tab === 'active') {
        query = query.in('status', ['requested', 'accepted', 'active'])
      } else if (tab === 'completed') {
        query = query.in('status', ['completed', 'declined', 'cancelled'])
      }

      const { data: rows } = await query
      if (!rows || rows.length === 0) { setSessions([]); setLoading(false); return }

      const otherIds = rows.map(r => r.mandant_id === user.id ? r.anwalt_id : r.mandant_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', otherIds)

      const pMap = new Map((profiles || []).map(p => [p.id, p]))

      setSessions(rows.map(r => {
        const otherId = r.mandant_id === user.id ? r.anwalt_id : r.mandant_id
        const otherP = pMap.get(otherId)
        return {
          id: r.id,
          status: r.status,
          type: r.type,
          created_at: r.created_at,
          started_at: r.started_at,
          ended_at: r.ended_at,
          duration_seconds: r.duration_seconds,
          other_name: otherP ? `${otherP.first_name || ''} ${otherP.last_name || ''}` : 'Unbekannt',
          other_role: role === 'mandant' ? 'Anwalt' : 'Mandant',
        }
      }))
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function formatDuration(seconds: number | null) {
    if (!seconds) return '–'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Meine Beratungen</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Laden...</div>
      ) : sessions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-navy-400">Keine Beratungen in dieser Kategorie.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const st = statusLabels[s.status] || statusLabels.requested
            const isClickable = ['requested', 'accepted', 'active'].includes(s.status)

            const cardContent = (
              <Card className={`p-5 ${isClickable ? 'hover:border-gold-300 hover:shadow-md transition-all cursor-pointer' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{s.other_name}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-navy-400 mt-1">
                      {s.type === 'chat' ? '💬 Chat' : '📹 Video'} &middot;{' '}
                      {new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {s.duration_seconds ? ` · ${formatDuration(s.duration_seconds)}` : ''}
                    </p>
                  </div>
                  {isClickable && (
                    <svg className="w-5 h-5 text-navy-300 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  )}
                </div>
              </Card>
            )

            return isClickable ? (
              <Link key={s.id} href={`/beratung/${s.id}`}>{cardContent}</Link>
            ) : (
              <div key={s.id}>{cardContent}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
