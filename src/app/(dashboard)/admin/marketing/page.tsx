'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Campaign {
  id: string; name: string; platform: string; budget: number; spent: number; start_date: string; end_date: string; status: string; notes: string
}

interface Budget {
  id: string; department: string; year: number; total_budget: number; spent: number
}

const platformLabels: Record<string, string> = { google: 'Google Ads', meta: 'Meta (FB/IG)', linkedin: 'LinkedIn', tiktok: 'TikTok', print: 'Print', sonstiges: 'Sonstiges' }
const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  geplant: { label: 'Geplant', variant: 'neutral' },
  aktiv: { label: 'Aktiv', variant: 'success' },
  pausiert: { label: 'Pausiert', variant: 'warning' },
  beendet: { label: 'Beendet', variant: 'neutral' },
}
const deptLabels: Record<string, string> = { marketing: 'Marketing', entwicklung: 'Entwicklung', betrieb: 'Betrieb', hr: 'HR', geschaeftsfuehrung: 'GF' }

export default function MarketingPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'campaigns' | 'budgets'>('campaigns')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', platform: 'google', budget: '', start_date: '', end_date: '', notes: '' })
  const [budgetForm, setBudgetForm] = useState({ department: 'marketing', year: new Date().getFullYear().toString(), total_budget: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [campRes, budRes] = await Promise.all([
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('department_budgets').select('*').order('year', { ascending: false }),
    ])
    setCampaigns((campRes.data || []) as Campaign[])
    setBudgets((budRes.data || []) as Budget[])
    setLoading(false)
  }

  async function addCampaign() {
    if (!form.name) return
    await supabase.from('marketing_campaigns').insert({
      name: form.name, platform: form.platform,
      budget: form.budget ? parseFloat(form.budget) : null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      notes: form.notes || null, status: 'geplant',
    })
    setForm({ name: '', platform: 'google', budget: '', start_date: '', end_date: '', notes: '' })
    setShowForm(false)
    loadData()
  }

  async function updateCampaignStatus(id: string, status: string) {
    await supabase.from('marketing_campaigns').update({ status }).eq('id', id)
    loadData()
  }

  async function addBudget() {
    if (!budgetForm.total_budget) return
    await supabase.from('department_budgets').upsert({
      department: budgetForm.department, year: parseInt(budgetForm.year),
      total_budget: parseFloat(budgetForm.total_budget),
    }, { onConflict: 'department,year' })
    setBudgetForm({ department: 'marketing', year: new Date().getFullYear().toString(), total_budget: '' })
    loadData()
  }

  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Marketing & Budgets</h2>

      <div className="flex gap-1 bg-navy-100 rounded-xl p-1 w-fit">
        {(['campaigns', 'budgets'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${tab === t ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}>
            {t === 'campaigns' ? 'Kampagnen' : 'Budgets'}
          </button>
        ))}
      </div>

      {tab === 'campaigns' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5"><p className="text-sm text-navy-400">Kampagnen</p><p className="text-2xl font-bold text-navy-900">{campaigns.length}</p></Card>
            <Card className="p-5"><p className="text-sm text-navy-400">Budget gesamt</p><p className="text-2xl font-bold text-navy-900">{totalBudget.toFixed(2)} €</p></Card>
            <Card className="p-5"><p className="text-sm text-navy-400">Ausgegeben</p><p className="text-2xl font-bold text-navy-900">{totalSpent.toFixed(2)} €</p></Card>
          </div>

          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Abbrechen' : '+ Kampagne'}</Button>

          {showForm && (
            <Card className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input placeholder="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
                  {Object.entries(platformLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input type="number" step="0.01" placeholder="Budget (€)" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
                <div><label className="text-xs text-navy-400">Start</label><input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" /></div>
                <div><label className="text-xs text-navy-400">Ende</label><input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm" /></div>
                <input placeholder="Notizen" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
              </div>
              <Button variant="primary" size="sm" onClick={addCampaign} className="mt-3">Erstellen</Button>
            </Card>
          )}

          {loading ? <div className="text-center py-12 text-navy-400">Laden...</div> : (
            <div className="space-y-2">
              {campaigns.map(c => {
                const st = statusLabels[c.status] || statusLabels.geplant
                const pct = c.budget ? Math.round((c.spent / c.budget) * 100) : 0
                return (
                  <Card key={c.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900">{c.name}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                          <span className="text-xs text-navy-400">{platformLabels[c.platform] || c.platform}</span>
                        </div>
                        {c.budget && (
                          <div className="mt-2 w-48">
                            <div className="flex justify-between text-xs text-navy-400 mb-1">
                              <span>{c.spent.toFixed(0)} € / {c.budget.toFixed(0)} €</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {c.status !== 'aktiv' && <button onClick={() => updateCampaignStatus(c.id, 'aktiv')} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 cursor-pointer">Aktivieren</button>}
                        {c.status === 'aktiv' && <button onClick={() => updateCampaignStatus(c.id, 'pausiert')} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 cursor-pointer">Pausieren</button>}
                        {c.status !== 'beendet' && <button onClick={() => updateCampaignStatus(c.id, 'beendet')} className="text-xs px-2 py-1 rounded bg-navy-50 text-navy-600 cursor-pointer">Beenden</button>}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="p-5">
            <h3 className="font-semibold text-navy-800 mb-3">Budget festlegen</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <select value={budgetForm.department} onChange={e => setBudgetForm(p => ({ ...p, department: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
                {Object.entries(deptLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" value={budgetForm.year} onChange={e => setBudgetForm(p => ({ ...p, year: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm w-24" />
              <input type="number" step="0.01" placeholder="Budget (€)" value={budgetForm.total_budget} onChange={e => setBudgetForm(p => ({ ...p, total_budget: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
              <Button variant="primary" size="sm" onClick={addBudget}>Speichern</Button>
            </div>
          </Card>

          <div className="space-y-2">
            {budgets.map(b => {
              const pct = b.total_budget ? Math.round(((b.spent || 0) / b.total_budget) * 100) : 0
              return (
                <Card key={b.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-navy-900">{deptLabels[b.department] || b.department}</span>
                      <span className="text-sm text-navy-400 ml-2">{b.year}</span>
                    </div>
                    <span className="font-medium text-navy-800">{b.total_budget.toFixed(2)} €</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-navy-400 mb-1">
                      <span>Ausgegeben: {(b.spent || 0).toFixed(2)} €</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
