'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface BeaMessage { id: string; direction: string; sender: string | null; recipient: string | null; subject: string | null; body: string | null; status: string; created_at: string; case_id: string | null }

export default function BeaPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<BeaMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'inbound' | 'outbound' | 'drafts'>('inbound')
  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm] = useState({ recipient: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [selected, setSelected] = useState<BeaMessage | null>(null)

  useEffect(() => { loadMessages() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMessages() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('bea_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMessages((data || []) as BeaMessage[])
    setLoading(false)
  }

  async function sendMessage() {
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('bea_messages').insert({
      user_id: user.id, direction: 'outbound', recipient: form.recipient,
      subject: form.subject, body: form.body, status: 'sent',
    })
    setForm({ recipient: '', subject: '', body: '' }); setShowCompose(false); setSending(false); loadMessages()
  }

  const filtered = messages.filter(m => {
    if (tab === 'inbound') return m.direction === 'inbound'
    if (tab === 'outbound') return m.direction === 'outbound' && m.status !== 'draft'
    return m.status === 'draft'
  })

  if (selected) return (
    <div className="space-y-4 max-w-3xl">
      <button onClick={() => setSelected(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück</button>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={selected.direction === 'inbound' ? 'success' : 'neutral'}>{selected.direction === 'inbound' ? 'Eingang' : 'Ausgang'}</Badge>
          <span className="text-xs text-navy-400">{new Date(selected.created_at).toLocaleString('de-DE')}</span>
        </div>
        <h3 className="text-lg font-bold text-navy-800 mb-2">{selected.subject || '(Kein Betreff)'}</h3>
        <p className="text-sm text-navy-400 mb-4">{selected.direction === 'inbound' ? 'Von' : 'An'}: {selected.direction === 'inbound' ? selected.sender : selected.recipient}</p>
        <div className="text-navy-600 whitespace-pre-wrap">{selected.body}</div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">beA-Postfach</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCompose(!showCompose)}>{showCompose ? 'Abbrechen' : '✉️ Neue Nachricht'}</Button>
      </div>

      <div className="flex gap-2">
        {([['inbound', '📥 Eingang'], ['outbound', '📤 Ausgang'], ['drafts', '📝 Entwürfe']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${tab === key ? 'bg-navy-800 text-white' : 'bg-navy-100 text-navy-500'}`}>{label}</button>
        ))}
      </div>

      {showCompose && (
        <Card className="p-6 space-y-3">
          <input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} placeholder="Empfänger (beA-SAFE-ID) *" className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm" />
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Betreff *" className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm" />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Nachricht..." rows={6} className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y" />
          <Button variant="primary" size="sm" onClick={sendMessage} loading={sending} disabled={!form.recipient.trim() || !form.subject.trim()}>Nachricht senden</Button>
        </Card>
      )}

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>
      : filtered.length === 0 ? (
        <Card className="p-8 text-center"><span className="text-4xl block mb-3">📭</span><p className="text-navy-400">Keine Nachrichten.</p>
          <p className="text-xs text-navy-300 mt-1">beA-Integration erfordert eine gültige beA-Karte und SAFE-ID.</p></Card>
      ) : (
        <div className="space-y-2">{filtered.map(m => (
          <Card key={m.id} className="p-4 cursor-pointer hover:border-gold-300 transition-all" onClick={() => setSelected(m)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy-800">{m.subject || '(Kein Betreff)'}</p>
                <p className="text-xs text-navy-400">{m.direction === 'inbound' ? `Von: ${m.sender}` : `An: ${m.recipient}`} · {new Date(m.created_at).toLocaleString('de-DE')}</p>
              </div>
              <Badge variant={m.status === 'read' ? 'neutral' : m.status === 'sent' ? 'success' : 'warning'}>{m.status === 'read' ? 'Gelesen' : m.status === 'sent' ? 'Gesendet' : 'Neu'}</Badge>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
