'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function FinanzenPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [report, setReport] = useState<{
    revenue: number; platformFee: number; payouts: number; sessions: number; expenses: number
  } | null>(null)
  const [expenses, setExpenses] = useState<Record<string, unknown>[]>([])
  const [newExpense, setNewExpense] = useState({ category: '', description: '', amount: '', department: 'betrieb', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { generateReport() }, [])

  async function generateReport() {
    setLoading(true)
    const [payRes, expRes] = await Promise.all([
      supabase.from('session_payments')
        .select('amount_captured, platform_fee')
        .eq('status', 'captured')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59'),
      supabase.from('expenses')
        .select('*')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false }),
    ])

    const payments = payRes.data || []
    const revenue = payments.reduce((s, p) => s + (p.amount_captured || 0), 0)
    const platformFee = payments.reduce((s, p) => s + (p.platform_fee || 0), 0)
    const totalExpenses = (expRes.data || []).reduce((s, e) => s + Number(e.amount || 0), 0)

    setReport({ revenue, platformFee, payouts: revenue - platformFee, sessions: payments.length, expenses: totalExpenses })
    setExpenses(expRes.data || [])
    setLoading(false)
  }

  async function addExpense() {
    if (!newExpense.category || !newExpense.amount) return
    await supabase.from('expenses').insert({
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      department: newExpense.department,
      date: newExpense.date,
    })
    setNewExpense({ category: '', description: '', amount: '', department: 'betrieb', date: new Date().toISOString().split('T')[0] })
    generateReport()
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-navy-800">Finanzen & Berichte</h2>

      {/* Date Range */}
      <Card className="p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-navy-400 block mb-1">Von</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <div>
            <label className="text-xs text-navy-400 block mb-1">Bis</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <Button variant="primary" size="sm" onClick={generateReport} loading={loading}>Bericht generieren</Button>
        </div>
      </Card>

      {/* KPIs */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-gradient-to-br from-navy-800 to-navy-900 text-white">
            <p className="text-sm text-navy-300">Umsatz</p>
            <p className="text-xl font-bold">{(report.revenue / 100).toFixed(2)} €</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-gold-400 to-gold-500 text-white">
            <p className="text-sm text-gold-100">Provision (5%)</p>
            <p className="text-xl font-bold">{(report.platformFee / 100).toFixed(2)} €</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-navy-400">Auszahlungen</p>
            <p className="text-xl font-bold text-navy-900">{(report.payouts / 100).toFixed(2)} €</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-navy-400">Beratungen</p>
            <p className="text-xl font-bold text-navy-900">{report.sessions}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-navy-400">Ausgaben</p>
            <p className="text-xl font-bold text-red-600">{report.expenses.toFixed(2)} €</p>
          </Card>
        </div>
      )}

      {/* Add Expense */}
      <Card className="p-5">
        <h3 className="font-semibold text-navy-800 mb-3">Ausgabe erfassen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input placeholder="Kategorie" value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          <input placeholder="Beschreibung" value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          <input type="number" step="0.01" placeholder="Betrag (€)" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          <select value={newExpense.department} onChange={e => setNewExpense(p => ({ ...p, department: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
            <option value="betrieb">Betrieb</option>
            <option value="marketing">Marketing</option>
            <option value="entwicklung">Entwicklung</option>
            <option value="hr">HR</option>
            <option value="geschaeftsfuehrung">GF</option>
          </select>
          <Button variant="primary" size="sm" onClick={addExpense}>+ Hinzufügen</Button>
        </div>
      </Card>

      {/* Expenses List */}
      {expenses.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-navy-800 mb-3">Ausgaben im Zeitraum</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-navy-400 border-b border-navy-100">
                  <th className="pb-2">Datum</th><th className="pb-2">Kategorie</th><th className="pb-2">Beschreibung</th><th className="pb-2">Abteilung</th><th className="pb-2 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id as string} className="border-b border-navy-50">
                    <td className="py-2">{new Date(e.date as string).toLocaleDateString('de-DE')}</td>
                    <td className="py-2">{e.category as string}</td>
                    <td className="py-2 text-navy-500">{(e.description as string) || '–'}</td>
                    <td className="py-2">{e.department as string}</td>
                    <td className="py-2 text-right font-medium">{Number(e.amount).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
