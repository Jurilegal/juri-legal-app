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

      {/* Affidavit & DocuSign */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Rechtliche Erklärungen</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${l.has_submitted_affidavit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {l.has_submitted_affidavit ? '✓' : '✗'}
            </span>
            <div>
              <p className="text-sm font-medium text-navy-800">Eidesstattliche Erklärung</p>
              <p className="text-xs text-navy-400">Haftungsübernahme für Falschangaben bei Registrierung</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${l.docusign_contract_path ? 'bg-emerald-100 text-emerald-700' : 'bg-navy-200 text-navy-500'}`}>
              {l.docusign_contract_path ? '✓' : '–'}
            </span>
            <div>
              <p className="text-sm font-medium text-navy-800">DocuSign-Vertrag</p>
              <p className="text-xs text-navy-400">{l.docusign_contract_path ? 'Hochgeladen' : 'Noch nicht vorhanden'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Commission Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Provisionsmodell</h2>
        <CommissionEditor lawyerId={id} initial={{
          commission_type: (l.commission_type as string) || 'standard',
          commission_rate: (l.commission_rate as number) || 5,
          free_months_count: (l.free_months_count as number) || 0,
          free_until_revenue: (l.free_until_revenue as number) || 0,
        }} />
      </Card>

      {/* Documents with individual verification */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Dokumente ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-navy-400 text-sm">Keine Dokumente hochgeladen.</p>
        ) : (
          <div className="space-y-3">
            {docs.map(d => (
              <DocumentCard key={d.id as string} doc={d} onUpdate={async () => {
                const { data } = await supabase.from('lawyer_documents').select('*').eq('user_id', id).order('created_at', { ascending: false })
                setDocs(data || [])
              }} />
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

// Commission Editor Component
function CommissionEditor({ lawyerId, initial }: {
  lawyerId: string
  initial: { commission_type: string; commission_rate: number; free_months_count: number; free_until_revenue: number }
}) {
  const supabase = createClient()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('lawyer_profiles').update({
      commission_type: form.commission_type,
      commission_rate: form.commission_rate,
      free_months_count: form.free_months_count,
      free_until_revenue: form.free_until_revenue,
    }).eq('user_id', lawyerId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-navy-400 block mb-1">Modell</label>
          <select value={form.commission_type} onChange={e => setForm(p => ({ ...p, commission_type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm">
            <option value="standard">Standard (5%)</option>
            <option value="custom_rate">Individueller Satz</option>
            <option value="free_months">Gratis-Zeitraum</option>
            <option value="free_until_revenue">Gratis bis Umsatz</option>
          </select>
        </div>
        {form.commission_type === 'custom_rate' && (
          <div>
            <label className="text-xs text-navy-400 block mb-1">Provisionssatz (%)</label>
            <input type="number" step="0.1" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
        )}
        {form.commission_type === 'free_months' && (
          <div>
            <label className="text-xs text-navy-400 block mb-1">Anzahl Gratis-Monate</label>
            <input type="number" value={form.free_months_count} onChange={e => setForm(p => ({ ...p, free_months_count: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
        )}
        {form.commission_type === 'free_until_revenue' && (
          <div>
            <label className="text-xs text-navy-400 block mb-1">Gratis bis Umsatz (€)</label>
            <input type="number" step="0.01" value={form.free_until_revenue} onChange={e => setForm(p => ({ ...p, free_until_revenue: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={save} loading={saving}>Speichern</Button>
        {saved && <span className="text-sm text-emerald-600">✓ Gespeichert</span>}
      </div>
    </div>
  )
}

// Document Card with individual approve/reject/history
function DocumentCard({ doc, onUpdate }: { doc: Record<string, unknown>; onUpdate: () => void }) {
  const supabase = createClient()
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const history = (doc.verification_history as Array<{ action: string; date: string; reason?: string }>) || []
  const isImmutable = doc.is_immutable as boolean

  async function approveDoc() {
    const newHistory = [...history, { action: 'approved', date: new Date().toISOString() }]
    await supabase.from('lawyer_documents').update({
      status: 'approved', verification_history: newHistory, is_immutable: true
    }).eq('id', doc.id as string)
    onUpdate()
  }

  async function rejectDoc() {
    if (!rejectionReason.trim()) return
    const newHistory = [...history, { action: 'rejected', date: new Date().toISOString(), reason: rejectionReason }]
    await supabase.from('lawyer_documents').update({
      status: 'rejected', rejection_reason: rejectionReason, verification_history: newHistory
    }).eq('id', doc.id as string)
    setShowReject(false)
    setRejectionReason('')
    onUpdate()
  }

  async function requestNew() {
    const newHistory = [...history, { action: 'resubmission_requested', date: new Date().toISOString() }]
    await supabase.from('lawyer_documents').update({
      status: 'pending_review', verification_history: newHistory
    }).eq('id', doc.id as string)
    onUpdate()
  }

  return (
    <div className="p-4 bg-navy-50 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-navy-800">{doc.document_type as string}</p>
            {isImmutable && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">🔒 Gesperrt</span>}
          </div>
          <p className="text-xs text-navy-400">{doc.original_filename as string}</p>
        </div>
        <Badge variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}>
          {doc.status as string}
        </Badge>
      </div>

      {!isImmutable && doc.status !== 'approved' && (
        <div className="flex gap-2">
          <button onClick={approveDoc} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer font-medium">✓ Genehmigen</button>
          <button onClick={() => setShowReject(!showReject)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer font-medium">✗ Ablehnen</button>
          <button onClick={requestNew} className="text-xs px-3 py-1.5 rounded-lg bg-navy-100 text-navy-600 hover:bg-navy-200 cursor-pointer font-medium">↻ Neu anfordern</button>
        </div>
      )}

      {showReject && (
        <div className="flex gap-2">
          <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Begründung (Pflicht)..." className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-navy-200" />
          <button onClick={rejectDoc} disabled={!rejectionReason.trim()} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50">Ablehnen</button>
        </div>
      )}

      {history.length > 0 && (
        <details className="text-xs">
          <summary className="text-navy-400 cursor-pointer">Prüfverlauf ({history.length})</summary>
          <div className="mt-2 space-y-1 pl-2 border-l-2 border-navy-200">
            {history.map((h, i) => (
              <div key={i} className="text-navy-500">
                <span className="font-medium">{h.action}</span> — {new Date(h.date).toLocaleString('de-DE')}
                {h.reason && <span className="text-red-500 ml-1">({h.reason})</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
