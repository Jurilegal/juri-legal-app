'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Contract {
  id: string; partner_name: string; type: string; description: string; start_date: string; end_date: string; renewal_date: string; monthly_cost: number
}

const typeLabels: Record<string, string> = { versicherung: 'Versicherung', dienstleister: 'Dienstleister', anwalt: 'Anwalt', miete: 'Miete', software: 'Software', sonstiges: 'Sonstiges' }
const types = Object.keys(typeLabels)

export default function VertraegePage() {
  const supabase = createClient()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ partner_name: '', type: 'dienstleister', description: '', start_date: '', end_date: '', renewal_date: '', monthly_cost: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('contracts').select('*').order('end_date', { ascending: true })
    setContracts((data || []) as Contract[])
    setLoading(false)
  }

  async function addContract() {
    if (!form.partner_name) return
    await supabase.from('contracts').insert({
      partner_name: form.partner_name, type: form.type,
      description: form.description || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      renewal_date: form.renewal_date || null,
      monthly_cost: form.monthly_cost ? parseFloat(form.monthly_cost) : null,
    })
    setForm({ partner_name: '', type: 'dienstleister', description: '', start_date: '', end_date: '', renewal_date: '', monthly_cost: '' })
    setShowForm(false)
    loadData()
  }

  async function deleteContract(id: string) {
    if (!confirm('Vertrag löschen?')) return
    await supabase.from('contracts').delete().eq('id', id)
    loadData()
  }

  const totalMonthlyCost = contracts.reduce((s, c) => s + (c.monthly_cost || 0), 0)
  const today = new Date().toISOString().split('T')[0]
  const expiringSoon = contracts.filter(c => c.end_date && c.end_date <= new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] && c.end_date >= today)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Vertragsmanagement</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Vertrag'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-navy-400">Verträge aktiv</p>
          <p className="text-2xl font-bold text-navy-900">{contracts.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-navy-400">Monatliche Kosten</p>
          <p className="text-2xl font-bold text-navy-900">{totalMonthlyCost.toFixed(2)} €</p>
        </Card>
        <Card className={`p-5 ${expiringSoon.length > 0 ? 'bg-amber-50 border-amber-200' : ''}`}>
          <p className="text-sm text-navy-400">Laufen bald aus</p>
          <p className="text-2xl font-bold text-amber-600">{expiringSoon.length}</p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-5">
          <h3 className="font-semibold text-navy-800 mb-3">Neuer Vertrag</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Partner *" value={form.partner_name} onChange={e => setForm(p => ({ ...p, partner_name: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
              {types.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
            </select>
            <input placeholder="Beschreibung" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
            <div><label className="text-xs text-navy-400">Beginn</label><input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" /></div>
            <div><label className="text-xs text-navy-400">Ende</label><input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" /></div>
            <input type="number" step="0.01" placeholder="Monatl. Kosten (€)" value={form.monthly_cost} onChange={e => setForm(p => ({ ...p, monthly_cost: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <Button variant="primary" size="sm" onClick={addContract} className="mt-3">Speichern</Button>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-navy-400">Laden...</div>
      ) : contracts.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Keine Verträge.</p></Card>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => {
            const isExpiring = expiringSoon.some(e => e.id === c.id)
            return (
              <Card key={c.id} className={`p-4 ${isExpiring ? 'border-amber-300 bg-amber-50/50' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{c.partner_name}</span>
                      <Badge variant={isExpiring ? 'warning' : 'success'}>{typeLabels[c.type] || c.type}</Badge>
                      {isExpiring && <Badge variant="warning">Läuft bald aus</Badge>}
                    </div>
                    <p className="text-sm text-navy-400">
                      {c.description || '–'}
                      {c.start_date && ` · Ab ${new Date(c.start_date).toLocaleDateString('de-DE')}`}
                      {c.end_date && ` · Bis ${new Date(c.end_date).toLocaleDateString('de-DE')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.monthly_cost && <span className="font-medium text-navy-800">{c.monthly_cost} €/M</span>}
                    <button onClick={() => deleteContract(c.id)} className="text-red-400 hover:text-red-600 text-sm cursor-pointer">✕</button>
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
