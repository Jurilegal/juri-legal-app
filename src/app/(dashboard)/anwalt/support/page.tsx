'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Ticket {
  id: string; subject: string; message: string; status: string; created_at: string
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  open: { label: 'Offen', variant: 'warning' },
  in_progress: { label: 'In Bearbeitung', variant: 'warning' },
  resolved: { label: 'Gelöst', variant: 'success' },
}

export default function SupportPage() {
  const supabase = createClient()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setTickets((data || []) as Ticket[])
    setLoading(false)
  }

  async function sendTicket() {
    if (!form.subject.trim() || !form.message.trim()) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: form.subject,
      message: form.message,
    })

    // Also notify via Supabase Realtime (admins subscribe to this)
    await supabase.from('tasks').insert({
      title: `Support: ${form.subject}`,
      description: form.message,
      status: 'open',
      module: 'accounts',
      related_entity_id: user.id,
      related_entity_type: 'support_ticket',
    })

    setForm({ subject: '', message: '' })
    setShowForm(false)
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    loadTickets()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Support</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '💬 Mit Mitarbeiter chatten'}
        </Button>
      </div>

      {sent && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          ✓ Ihre Anfrage wurde gesendet. Unser Team meldet sich schnellstmöglich bei Ihnen.
        </div>
      )}

      {showForm && (
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-3">Neue Support-Anfrage</h3>
          <div className="space-y-3">
            <input
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Betreff *"
              className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm"
            />
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Ihre Nachricht *"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"
            />
            <Button variant="primary" onClick={sendTicket} loading={sending} disabled={!form.subject.trim() || !form.message.trim()}>
              Anfrage senden
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-navy-400">Laden...</div>
      ) : tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">🎧</p>
          <p className="text-navy-400">Keine Support-Anfragen.</p>
          <p className="text-sm text-navy-300 mt-1">Wir sind für Sie da — stellen Sie jederzeit eine Anfrage.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => {
            const st = statusLabels[t.status] || statusLabels.open
            return (
              <Card key={t.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{t.subject}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-navy-500 mt-1 line-clamp-2">{t.message}</p>
                    <p className="text-xs text-navy-300 mt-2">{new Date(t.created_at).toLocaleString('de-DE')}</p>
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
