'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'

export default function AnwaltDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [lawyer, setLawyer] = useState<Record<string, unknown> | null>(null)
  const [docs, setDocs] = useState<Record<string, unknown>[]>([])
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([])
  const [payments, setPayments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [profRes, lawRes, docRes, sessRes, payRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('lawyer_profiles').select('*').eq('user_id', id).single(),
        supabase.from('lawyer_documents').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('consultation_sessions').select('*').eq('anwalt_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('session_payments').select('*').eq('anwalt_id', id).order('created_at', { ascending: false }).limit(20),
      ])
      setProfile(profRes.data)
      setLawyer(lawRes.data)
      setDocs(docRes.data || [])
      setSessions(sessRes.data || [])
      setPayments(payRes.data || [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function updateVerification(status: string) {
    await supabase.from('lawyer_profiles').update({ verification_status: status }).eq('user_id', id)
    setLawyer(prev => prev ? { ...prev, verification_status: status } : prev)
  }

  if (loading) return <div className="text-center py-12 text-navy-400">Laden...</div>
  if (!profile) return <div className="text-center py-12 text-navy-400">Nicht gefunden.</div>

  const p = profile
  const l = lawyer || {}
  const fullName = `${p.first_name || ''} ${p.last_name || ''}`
  const verStatus = l.verification_status as string

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/konten" className="text-sm text-navy-400 hover:text-navy-600">← Zurück</Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar name={fullName} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-navy-900">{fullName}</h1>
              {verStatus === 'approved' && <Badge variant="success">Verifiziert</Badge>}
              {verStatus === 'pending' && <Badge variant="warning">Ausstehend</Badge>}
              {verStatus === 'rejected' && <Badge variant="error">Abgelehnt</Badge>}
            </div>
            <p className="text-navy-400">{p.email as string}</p>
            {p.phone ? <p className="text-sm text-navy-400">📞 {p.phone as string}</p> : null}
            <p className="text-sm text-navy-300 mt-1">Registriert: {new Date(p.created_at as string).toLocaleDateString('de-DE')}</p>

            <div className="flex gap-2 mt-4">
              {verStatus !== 'approved' && (
                <Button variant="primary" size="sm" onClick={() => updateVerification('approved')}>Genehmigen</Button>
              )}
              {verStatus !== 'rejected' && (
                <Button variant="outline" size="sm" onClick={() => updateVerification('rejected')} className="text-red-600 border-red-200">Ablehnen</Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Data */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Profildaten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-navy-400">Headline:</span> <span className="text-navy-800">{(l.headline as string) || '–'}</span></div>
          <div><span className="text-navy-400">Stadt:</span> <span className="text-navy-800">{(l.city as string) || '–'}</span></div>
          <div><span className="text-navy-400">Minutenpreis:</span> <span className="text-navy-800">{l.minute_rate ? `${l.minute_rate} €` : '–'}</span></div>
          <div><span className="text-navy-400">Erfahrung:</span> <span className="text-navy-800">{l.experience_years ? `${l.experience_years} Jahre` : '–'}</span></div>
          <div><span className="text-navy-400">Bewertung:</span> <span className="text-navy-800">{l.rating ? `${l.rating} ★ (${l.total_reviews || 0})` : '–'}</span></div>
          <div><span className="text-navy-400">Verfügbarkeit:</span> <span className="text-navy-800">{(l.availability_status as string) || 'offline'}</span></div>
          <div className="sm:col-span-2"><span className="text-navy-400">Fachgebiete:</span> <span className="text-navy-800">{(l.specializations as string[])?.join(', ') || '–'}</span></div>
          <div className="sm:col-span-2"><span className="text-navy-400">Bio:</span> <span className="text-navy-800">{(l.bio as string) || '–'}</span></div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Dokumente ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-navy-400 text-sm">Keine Dokumente hochgeladen.</p>
        ) : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id as string} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-navy-800">{d.document_type as string}</p>
                  <p className="text-xs text-navy-400">{d.original_filename as string}</p>
                </div>
                <Badge variant={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'error' : 'warning'}>
                  {d.status as string}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sessions */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Beratungen ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p className="text-navy-400 text-sm">Keine Beratungen.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id as string} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl text-sm">
                <div>
                  <span className="text-navy-800">{(s.type as string) === 'chat' ? '💬' : '📹'} {new Date(s.created_at as string).toLocaleDateString('de-DE')}</span>
                  {s.duration_seconds ? <span className="text-navy-400 ml-2">{Math.ceil(s.duration_seconds as number / 60)} Min.</span> : null}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : s.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-navy-100 text-navy-500'}`}>
                  {s.status as string}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payments */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Auszahlungen ({payments.length})</h2>
        {payments.length === 0 ? (
          <p className="text-navy-400 text-sm">Keine Zahlungen.</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id as string} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl text-sm">
                <div>
                  <span className="text-navy-800">{new Date(p.created_at as string).toLocaleDateString('de-DE')}</span>
                  <span className="text-navy-400 ml-2">{p.duration_seconds ? `${Math.ceil(p.duration_seconds as number / 60)} Min.` : ''}</span>
                </div>
                <span className="font-medium text-navy-800">
                  {p.amount_captured ? `${((p.amount_captured as number) / 100).toFixed(2)} €` : '–'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
