'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Invoice { id: string; invoice_number: string | null; total_amount: number | null; tax_amount: number | null; status: string; billing_type: string; items: Array<{ desc: string; qty: number; rate: number }>; created_at: string; client_name?: string }
interface Client { id: string; first_name: string | null; last_name: string | null; company_name: string | null }
interface TimeEntry { id: string; description: string; duration_minutes: number; hourly_rate: number | null; date: string; invoiced: boolean }

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  draft: { label: 'Entwurf', variant: 'neutral' }, sent: { label: 'Versendet', variant: 'warning' },
  paid: { label: 'Bezahlt', variant: 'success' }, overdue: { label: 'Überfällig', variant: 'error' },
  cancelled: { label: 'Storniert', variant: 'error' },
}

export default function RechnungenPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [unbilledEntries, setUnbilledEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: inv }, { data: cl }, { data: te }] = await Promise.all([
      supabase.from('kanzlei_invoices').select('*, kanzlei_clients(first_name, last_name, company_name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('kanzlei_clients').select('id, first_name, last_name, company_name').eq('user_id', user.id),
      supabase.from('time_entries').select('*').eq('user_id', user.id).eq('billable', true).eq('invoiced', false).order('date'),
    ])
    setInvoices((inv || []).map((i: Record<string, unknown>) => {
      const c = i.kanzlei_clients as { first_name: string; last_name: string; company_name: string | null } | null
      return { ...i, client_name: c ? `${c.first_name} ${c.last_name}${c.company_name ? ` (${c.company_name})` : ''}` : undefined }
    }) as Invoice[])
    setClients((cl || []) as Client[])
    setUnbilledEntries((te || []) as TimeEntry[])
    setLoading(false)
  }

  async function createInvoice() {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const entries = unbilledEntries.filter(e => selectedEntries.includes(e.id))
    const items = entries.map(e => ({ desc: e.description, qty: e.duration_minutes, rate: e.hourly_rate || 250 }))
    const net = entries.reduce((s, e) => s + (e.duration_minutes / 60) * (e.hourly_rate || 250), 0)
    const tax = net * 0.19
    const num = `JL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    await supabase.from('kanzlei_invoices').insert({
      user_id: user.id, client_id: selectedClient || null,
      invoice_number: num, total_amount: net + tax, tax_amount: tax,
      status: 'draft', items,
    })

    // Mark entries as invoiced
    if (selectedEntries.length > 0) {
      await supabase.from('time_entries').update({ invoiced: true }).in('id', selectedEntries)
    }

    setShowCreate(false); setSelectedClient(''); setSelectedEntries([]); setCreating(false); loadAll()
  }

  function toggleEntry(id: string) {
    setSelectedEntries(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  const selectedTotal = unbilledEntries.filter(e => selectedEntries.includes(e.id)).reduce((s, e) => s + (e.duration_minutes / 60) * (e.hourly_rate || 250), 0)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Rechnungen</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Abbrechen' : '+ Neue Rechnung'}</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Gesamt</p><p className="text-xl font-bold text-navy-900">{invoices.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Offen</p><p className="text-xl font-bold text-amber-600">{invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Bezahlt</p><p className="text-xl font-bold text-emerald-600">{invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0).toFixed(2)} €</p></Card>
      </div>

      {showCreate && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Rechnung erstellen</h3>
          <div>
            <label className="text-sm text-navy-400 block mb-1">Mandant (optional)</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              <option value="">— Ohne Zuordnung —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
            </select>
          </div>
          {unbilledEntries.length > 0 ? (
            <div>
              <p className="text-sm text-navy-500 mb-2">Nicht abgerechnete Zeiteinträge:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">{unbilledEntries.map(e => (
                <label key={e.id} className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl cursor-pointer hover:bg-navy-100">
                  <input type="checkbox" checked={selectedEntries.includes(e.id)} onChange={() => toggleEntry(e.id)} className="w-4 h-4 rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-800">{e.description}</p>
                    <p className="text-xs text-navy-400">{new Date(e.date).toLocaleDateString('de-DE')} · {e.duration_minutes} Min.</p>
                  </div>
                  <span className="text-sm font-bold text-navy-700">{((e.duration_minutes / 60) * (e.hourly_rate || 250)).toFixed(2)} €</span>
                </label>
              ))}</div>
              {selectedEntries.length > 0 && (
                <div className="flex items-center justify-between mt-3 p-3 bg-gold-50 rounded-xl">
                  <span className="text-sm text-navy-600">{selectedEntries.length} Einträge ausgewählt</span>
                  <span className="font-bold text-navy-800">{selectedTotal.toFixed(2)} € netto + {(selectedTotal * 0.19).toFixed(2)} € MwSt. = {(selectedTotal * 1.19).toFixed(2)} € brutto</span>
                </div>
              )}
            </div>
          ) : <p className="text-sm text-navy-400">Keine offenen Zeiteinträge vorhanden.</p>}
          <Button variant="primary" size="sm" onClick={createInvoice} loading={creating} disabled={selectedEntries.length === 0}>Rechnung erstellen</Button>
        </Card>
      )}

      {invoices.length === 0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Rechnungen.</p></Card> : (
        <div className="space-y-2">{invoices.map(inv => {
          const st = statusMap[inv.status] || statusMap.draft
          return (
            <Card key={inv.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy-800">{inv.invoice_number || '—'}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <p className="text-sm text-navy-400 mt-0.5">{inv.client_name || 'Kein Mandant'} · {new Date(inv.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <span className="text-lg font-bold text-navy-900">{(inv.total_amount || 0).toFixed(2)} €</span>
              </div>
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
