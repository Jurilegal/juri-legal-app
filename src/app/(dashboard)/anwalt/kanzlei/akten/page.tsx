'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Case { id: string; reference_number: string | null; title: string; status: string; case_type: string | null; opponent_name: string | null; client_name?: string; created_at: string; tags: string[] }

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  open: { label: 'Offen', variant: 'warning' }, in_progress: { label: 'In Bearbeitung', variant: 'neutral' },
  closed: { label: 'Abgeschlossen', variant: 'success' }, archived: { label: 'Archiviert', variant: 'error' },
}

export default function AktenPage() {
  const supabase = createClient()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', reference_number: '', case_type: '', opponent_name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<Case | null>(null)
  const [docs, setDocs] = useState<Array<{ id: string; title: string; original_filename: string; created_at: string }>>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadCases() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCases() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('cases').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setCases((data || []) as Case[])
    setLoading(false)
  }

  async function createCase() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('cases').insert({ ...form, user_id: user.id })
    setForm({ title: '', reference_number: '', case_type: '', opponent_name: '', description: '' })
    setShowForm(false); setSaving(false); loadCases()
  }

  async function openDetail(c: Case) {
    setDetail(c)
    const { data } = await supabase.from('case_documents').select('id,title,original_filename,created_at').eq('case_id', c.id).order('created_at', { ascending: false })
    setDocs((data || []) as typeof docs)
  }

  async function uploadDoc(file: File) {
    if (!detail) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const path = `kanzlei/${user.id}/${detail.id}/${Date.now()}-${file.name}`
    await supabase.storage.from('lawyer-documents').upload(path, file)
    await supabase.from('case_documents').insert({ case_id: detail.id, user_id: user.id, title: file.name, file_path: path, original_filename: file.name, mime_type: file.type, file_size: file.size })
    const { data } = await supabase.from('case_documents').select('id,title,original_filename,created_at').eq('case_id', detail.id).order('created_at', { ascending: false })
    setDocs((data || []) as typeof docs)
    setUploading(false)
  }

  const filtered = cases.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.reference_number?.includes(search))

  if (detail) return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => setDetail(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück zur Übersicht</button>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy-800">{detail.title}</h2>
          {detail.reference_number && <p className="text-sm text-navy-400">Az: {detail.reference_number}</p>}
        </div>
        <Badge variant={statusMap[detail.status]?.variant || 'neutral'}>{statusMap[detail.status]?.label || detail.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {detail.case_type && <Card className="p-4"><p className="text-xs text-navy-400">Rechtsgebiet</p><p className="font-medium text-navy-800">{detail.case_type}</p></Card>}
        {detail.opponent_name && <Card className="p-4"><p className="text-xs text-navy-400">Gegner</p><p className="font-medium text-navy-800">{detail.opponent_name}</p></Card>}
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-800">Dokumente ({docs.length})</h3>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-navy-200 text-sm text-navy-600 cursor-pointer hover:bg-navy-50">
            {uploading ? 'Hochladen...' : '📤 Dokument hochladen'}
            <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0]) }} disabled={uploading} />
          </label>
        </div>
        {docs.length === 0 ? <p className="text-sm text-navy-400">Keine Dokumente.</p> : (
          <div className="space-y-2">{docs.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
              <div><p className="text-sm font-medium text-navy-800">📄 {d.original_filename}</p><p className="text-xs text-navy-400">{new Date(d.created_at).toLocaleDateString('de-DE')}</p></div>
            </div>
          ))}</div>
        )}
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-navy-800">Digitale Akten</h2>
        <div className="flex gap-2">
          <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Abbrechen' : '+ Neue Akte'}</Button>
        </div>
      </div>
      {showForm && (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Input label="Titel *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="Aktenzeichen" value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} />
            <Input label="Rechtsgebiet" value={form.case_type} onChange={e => setForm(f => ({ ...f, case_type: e.target.value }))} />
            <Input label="Gegner" value={form.opponent_name} onChange={e => setForm(f => ({ ...f, opponent_name: e.target.value }))} />
          </div>
          <Button variant="primary" size="sm" onClick={createCase} loading={saving} disabled={!form.title.trim()}>Akte anlegen</Button>
        </Card>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>
      : filtered.length === 0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Akten gefunden.</p></Card>
      : <div className="space-y-3">{filtered.map(c => {
        const st = statusMap[c.status] || { label: c.status, variant: 'neutral' as const }
        return (
          <Card key={c.id} className="p-5 cursor-pointer hover:border-gold-300 transition-all" onClick={() => openDetail(c)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium text-navy-800">{c.title}</span><Badge variant={st.variant}>{st.label}</Badge></div>
                <p className="text-sm text-navy-400 mt-1">{c.reference_number && `Az: ${c.reference_number} · `}{c.case_type || ''}{c.opponent_name ? ` · Gegner: ${c.opponent_name}` : ''}</p>
              </div>
              <span className="text-xs text-navy-300">{new Date(c.created_at).toLocaleDateString('de-DE')}</span>
            </div>
          </Card>
        )
      })}</div>}
    </div>
  )
}
