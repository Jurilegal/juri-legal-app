'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { AvailabilityStatus } from '@/lib/types/database'

const statusConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
  busy: { label: 'Beschäftigt', color: 'bg-amber-500', dot: 'bg-amber-400' },
  offline: { label: 'Offline', color: 'bg-gray-400', dot: 'bg-gray-400' },
}

const statusOrder: AvailabilityStatus[] = ['online', 'busy', 'offline']

interface SessionRequest {
  id: string
  mandant_id: string
  status: string
  type: string
  created_at: string
  mandant_name: string
}

export default function AnwaltDashboardPage() {
  const supabase = createClient()
  const [availability, setAvailability] = useState<AvailabilityStatus>('offline')
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Fetch current availability
      const { data: lawyer } = await supabase
        .from('lawyer_profiles')
        .select('availability_status')
        .eq('user_id', user.id)
        .single()
      if (lawyer?.availability_status) {
        setAvailability(lawyer.availability_status as AvailabilityStatus)
      }

      // Fetch pending session requests
      await fetchRequests(user.id)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('session-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `anwalt_id=eq.${userId}`,
        },
        () => { fetchRequests(userId) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchRequests(uid: string) {
    const { data: sessions } = await supabase
      .from('consultation_sessions')
      .select('id, mandant_id, status, type, created_at')
      .eq('anwalt_id', uid)
      .eq('status', 'requested')
      .order('created_at', { ascending: false })

    if (!sessions || sessions.length === 0) {
      setRequests([])
      return
    }

    const mandantIds = sessions.map(s => s.mandant_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', mandantIds)

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`])
    )

    setRequests(
      sessions.map(s => ({
        ...s,
        mandant_name: profileMap.get(s.mandant_id) || 'Unbekannt',
      }))
    )
  }

  async function toggleAvailability() {
    if (!userId) return
    setLoading(true)
    const currentIdx = statusOrder.indexOf(availability)
    const next = statusOrder[(currentIdx + 1) % statusOrder.length]

    await supabase
      .from('lawyer_profiles')
      .update({ availability_status: next, last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)

    setAvailability(next)
    setLoading(false)
  }

  async function handleSession(sessionId: string, accept: boolean) {
    const update = accept
      ? { status: 'active' as const, started_at: new Date().toISOString() }
      : { status: 'declined' as const }

    await supabase
      .from('consultation_sessions')
      .update(update)
      .eq('id', sessionId)

    setRequests(prev => prev.filter(r => r.id !== sessionId))
  }

  const config = statusConfig[availability]

  return (
    <div className="space-y-8">
      {/* Availability Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${config.dot} animate-pulse`} />
            <div>
              <p className="text-sm text-navy-400">Verfügbarkeitsstatus</p>
              <p className="text-lg font-bold text-navy-900">{config.label}</p>
            </div>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={loading}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-200 cursor-pointer ${config.color}`}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                availability === 'online' ? 'translate-x-11' : availability === 'busy' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Beratungen', value: '0', icon: '📞' },
          { label: 'Bewertung', value: '–', icon: '⭐' },
          { label: 'Einnahmen', value: '0,00 €', icon: '💰' },
          { label: 'Status', value: config.label, icon: availability === 'online' ? '🟢' : availability === 'busy' ? '🟡' : '⚫' },
        ].map(s => (
          <Card key={s.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-400">{s.label}</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Session Requests */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-navy-800">Eingehende Beratungsanfragen</h2>
          {requests.map(req => (
            <Card key={req.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-navy-900">{req.mandant_name}</p>
                  <p className="text-sm text-navy-400">
                    {req.type === 'chat' ? 'Chat-Beratung' : 'Video-Beratung'} &middot;{' '}
                    {new Date(req.created_at).toLocaleString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleSession(req.id, true)}>
                    Annehmen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSession(req.id, false)}>
                    Ablehnen
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Getting Started */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Erste Schritte</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gold-50 rounded-xl border border-gold-200">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
            <p className="text-sm text-navy-700"><strong>Profil vervollständigen</strong> — Fügen Sie Fachgebiete, Bio und Minutenpreis hinzu</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-100">
            <div className="w-8 h-8 bg-navy-300 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
            <p className="text-sm text-navy-500">Dokumente hochladen (Zulassung & Ausweis)</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-100">
            <div className="w-8 h-8 bg-navy-300 rounded-lg flex items-center justify-center text-white text-sm font-bold">3</div>
            <p className="text-sm text-navy-500">Auf Verifizierung warten & Verfügbarkeit aktivieren</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
