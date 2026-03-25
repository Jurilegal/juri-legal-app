'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { AvailabilityStatus } from '@/lib/types/database'

const statusConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
  busy: { label: 'Beschäftigt', color: 'bg-amber-500', dot: 'bg-amber-400' },
  offline: { label: 'Offline', color: 'bg-gray-400', dot: 'bg-gray-400' },
}

const statusOrder: AvailabilityStatus[] = ['online', 'busy', 'offline']

interface ChecklistItem { key: string; label: string; href: string; done: boolean }

export default function AnwaltDashboardPage() {
  const supabase = createClient()
  const [availability, setAvailability] = useState<AvailabilityStatus>('offline')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [stats, setStats] = useState({ sessions: 0, rating: 0, reviews: 0, earnings: 0 })
  const [requests, setRequests] = useState<Array<{ id: string; mandant_name: string; type: string; created_at: string }>>([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: lawyer } = await supabase.from('lawyer_profiles').select('*').eq('user_id', user.id).single()
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single()

      if (lawyer?.availability_status) setAvailability(lawyer.availability_status as AvailabilityStatus)

      // Build checklist
      const items: ChecklistItem[] = [
        { key: 'avatar', label: 'Profilbild hochladen', href: '/anwalt/profil', done: !!profile?.avatar_url },
        { key: 'bio', label: 'Profil vervollständigen (Bio & Fachgebiete)', href: '/anwalt/profil', done: !!(lawyer?.bio && (lawyer?.specializations as unknown[])?.length > 0) },
        { key: 'pricing', label: 'Minutenpreis festlegen', href: '/anwalt/preise', done: !!(lawyer?.minute_rate_video || lawyer?.minute_rate) },
        { key: 'documents', label: 'Dokumente einreichen', href: '/anwalt/dokumente', done: lawyer?.verification_status === 'approved' },
        { key: 'availability', label: 'Verfügbarkeit festlegen', href: '/anwalt/verfuegbarkeit', done: !!((lawyer?.availability_slots as unknown[])?.length > 0) },
        { key: 'channels', label: 'Kommunikationskanäle wählen', href: '/anwalt/verfuegbarkeit', done: !!((lawyer?.preferred_channels as unknown[])?.length > 0) },
      ]
      setChecklist(items)

      // Stats
      const { count: sessCount } = await supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('anwalt_id', user.id).eq('status', 'completed')
      const { data: payments } = await supabase.from('session_payments').select('amount_captured, platform_fee').eq('anwalt_id', user.id).eq('status', 'captured')
      const totalEarnings = (payments || []).reduce((s, p) => s + ((p.amount_captured || 0) - (p.platform_fee || 0)), 0)

      setStats({
        sessions: sessCount || 0,
        rating: lawyer?.rating || 0,
        reviews: lawyer?.total_reviews || 0,
        earnings: totalEarnings,
      })

      // Pending requests
      await fetchRequests(user.id)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel('session-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultation_sessions', filter: `anwalt_id=eq.${userId}` },
        () => { fetchRequests(userId) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchRequests(uid: string) {
    const { data: sessions } = await supabase.from('consultation_sessions')
      .select('id, mandant_id, type, created_at').eq('anwalt_id', uid).eq('status', 'requested').order('created_at', { ascending: false })
    if (!sessions || sessions.length === 0) { setRequests([]); return }
    const ids = sessions.map(s => s.mandant_id)
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', ids)
    const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`]))
    setRequests(sessions.map(s => ({ ...s, mandant_name: pMap.get(s.mandant_id) || 'Unbekannt' })))
  }

  async function toggleAvailability() {
    if (!userId) return
    setLoading(true)
    const next = statusOrder[(statusOrder.indexOf(availability) + 1) % statusOrder.length]
    await supabase.from('lawyer_profiles').update({ availability_status: next, last_seen_at: new Date().toISOString() }).eq('user_id', userId)
    setAvailability(next)
    setLoading(false)
  }

  async function handleSession(sessionId: string, accept: boolean) {
    const update = accept ? { status: 'active' as const, started_at: new Date().toISOString() } : { status: 'declined' as const }
    await supabase.from('consultation_sessions').update(update).eq('id', sessionId)
    setRequests(prev => prev.filter(r => r.id !== sessionId))
  }

  const config = statusConfig[availability]
  const completedCount = checklist.filter(c => c.done).length
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0

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
          <button onClick={toggleAvailability} disabled={loading}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-200 cursor-pointer ${config.color}`}>
            <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              availability === 'online' ? 'translate-x-11' : availability === 'busy' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </Card>

      {/* Onboarding Checklist (if not 100%) */}
      {progress < 100 && (
        <Card className="p-6 border-gold-200 bg-gradient-to-r from-gold-50/50 to-white">
          <div className="flex items-center gap-6 mb-4">
            {/* Circular Progress */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#D4A843" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  className="transition-all duration-700" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-navy-900">{progress}%</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-navy-800">🚀 Erste Schritte</h2>
              <p className="text-sm text-navy-400 mt-1">{completedCount} von {checklist.length} Schritten abgeschlossen</p>
            </div>
          </div>
          <div className="space-y-2">
            {checklist.map(item => (
              <Link key={item.key} href={item.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${item.done ? 'bg-emerald-50' : 'bg-white border border-navy-100 hover:border-gold-300'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.done ? 'bg-emerald-400 text-white' : 'bg-navy-100 text-navy-400'
                }`}>
                  {item.done ? '✓' : ''}
                </span>
                <span className={`text-sm ${item.done ? 'text-emerald-700 line-through' : 'text-navy-700 font-medium'}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6"><p className="text-sm text-navy-400">Beratungen</p><p className="text-2xl font-bold text-navy-900 mt-1">{stats.sessions}</p></Card>
        <Card className="p-6"><p className="text-sm text-navy-400">Bewertung</p><p className="text-2xl font-bold text-gold-500 mt-1">{stats.rating > 0 ? `${stats.rating} ★` : '–'}</p><p className="text-xs text-navy-400">{stats.reviews} Bewertungen</p></Card>
        <Card className="p-6"><p className="text-sm text-navy-400">Netto-Einnahmen</p><p className="text-2xl font-bold text-emerald-600 mt-1">{(stats.earnings / 100).toFixed(2)} €</p></Card>
        <Card className="p-6"><p className="text-sm text-navy-400">Status</p><p className="text-2xl font-bold text-navy-900 mt-1">{availability === 'online' ? '🟢' : availability === 'busy' ? '🟡' : '⚫'} {config.label}</p></Card>
      </div>

      {/* Session Requests */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-navy-800">📨 Eingehende Beratungsanfragen</h2>
          {requests.map(req => (
            <Card key={req.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-navy-900">{req.mandant_name}</p>
                  <p className="text-sm text-navy-400">
                    {req.type === 'chat' ? '💬 Chat' : '📹 Video'} · {new Date(req.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleSession(req.id, true)}>Annehmen</Button>
                  <Button variant="outline" size="sm" onClick={() => handleSession(req.id, false)}>Ablehnen</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/anwalt/profil', icon: '👤', label: 'Profil' },
          { href: '/anwalt/verfuegbarkeit', icon: '📅', label: 'Verfügbarkeit' },
          { href: '/anwalt/preise', icon: '💰', label: 'Preise' },
          { href: '/anwalt/bewertungen', icon: '⭐', label: 'Bewertungen' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="p-4 text-center hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-medium text-navy-700 mt-1">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
