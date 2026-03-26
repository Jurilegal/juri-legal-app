'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Client { id: string; client_type: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; phone: string | null; address: string | null; city: string | null; zip: string | null; notes: string | null; created_at: string }

export default function MandantenPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ client_type: 'private', first_name: '', last_name: '', company_name: '', email: '', phone: '', address: '', city: '', zip: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadClients() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadClients() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('kanzlei_clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setClients((data || []) as Client[])
    setLoading(false)
  }

  async function saveClient() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (editing) {
      await supabase.from('kanzlei_clients').update(form).eq('id', editing.id)
    } else {
      await supabase.from('kanzlei_clients').insert({ ...form, user_id: user.id })
    }
    resetForm(); setSaving(false); loadClients()
  }

  function editClient(c: Client) {
    setForm({ client_type: c.client_type, first_name: c.first_name || '', last_name: c.last_name || '', company_name: c.company_name || '', email: c.email || '', phone: c.phone || '', address: c.address || '', city: c.city || '', zip: c.zip || '', notes: c.notes || '' })
    setEditing(c); setShowForm(true)
  }

  function resetForm() {
    setForm({ client_type: 'private', first_name: '', last_name: '', company_name: '', email: '', phone: '', address: '', city: '', zip: '', notes: '' })
    setEditing(null); setShowForm(false)
  }

  const filtered = clients.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (c.first_name?.toLowerCase().includes(s)) || (c.last_name?.toLowerCase().includes(s)) || (c.company_name?.toLowerCase().includes(s)) || (c.email?.toLowerCase().includes(s))
  })

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-navy-800">Kanzlei-Mandanten</h2>
        <div className="flex gap-2">
          <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>{showForm ? 'Abbrechen' : '+ Neuer Mandant'}</Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-3">{editing ? 'Mandant bearbeiten' : 'Neuen Mandanten anlegen'}</h3>
          <div className="flex gap-3 mb-4">
            {(['private', 'business'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, client_type: t }))}
                className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${form.client_type === t ? 'bg-navy-800 text-white' : 'bg-navy-100 text-navy-500'}`}>
                {t === 'private' ? '👤 Privatperson' : '🏢 Unternehmen'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Input label="Vorname *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <Input label="Nachname *" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            {form.client_type === 'business' && <Input label="Firmenname" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />}
            <Input label="E-Mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Telefon" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Straße" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <Input label="PLZ" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
            <Input label="Stadt" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notizen..." rows={2} className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm mb-3 resize-y" />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={saveClient} loading={saving} disabled={!form.first_name.trim() || !form.last_name.trim()}>{editing ? 'Speichern' : 'Anlegen'}</Button>
            {editing && <Button variant="secondary" size="sm" onClick={resetForm}>Abbrechen</Button>}
          </div>
        </Card>
      )}

      {filtered.length === 0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Mandanten gefunden.</p></Card> : (
        <div className="space-y-2">{filtered.map(c => (
          <Card key={c.id} className="p-4" onClick={() => editClient(c)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-navy-800">{c.first_name} {c.last_name}</span>
                  <Badge variant={c.client_type === 'business' ? 'neutral' : 'success'}>{c.client_type === 'business' ? 'Geschäftlich' : 'Privat'}</Badge>
                </div>
                <p className="text-sm text-navy-400 mt-0.5">
                  {c.company_name ? `${c.company_name} · ` : ''}{c.email || ''}{c.city ? ` · ${c.city}` : ''}
                </p>
              </div>
              <span className="text-xs text-navy-300">{new Date(c.created_at).toLocaleDateString('de-DE')}</span>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
