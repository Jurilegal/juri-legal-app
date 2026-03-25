'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Employee {
  id: string; full_name: string; email: string; position: string; department: string; salary: number; start_date: string; end_date: string | null
}

const departments = ['marketing','entwicklung','betrieb','hr','geschaeftsfuehrung']
const deptLabels: Record<string, string> = { marketing: 'Marketing', entwicklung: 'Entwicklung', betrieb: 'Betrieb', hr: 'HR', geschaeftsfuehrung: 'Geschäftsführung' }

export default function PersonalPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', position: '', department: 'betrieb', salary: '', start_date: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('full_name')
    setEmployees((data || []) as Employee[])
    setLoading(false)
  }

  async function addEmployee() {
    if (!form.full_name) return
    await supabase.from('employees').insert({
      full_name: form.full_name, email: form.email || null, position: form.position || null,
      department: form.department, salary: form.salary ? parseFloat(form.salary) : null,
      start_date: form.start_date || null,
    })
    setForm({ full_name: '', email: '', position: '', department: 'betrieb', salary: '', start_date: '' })
    setShowForm(false)
    loadData()
  }

  async function removeEmployee(id: string) {
    if (!confirm('Mitarbeiter wirklich löschen?')) return
    await supabase.from('employees').delete().eq('id', id)
    loadData()
  }

  const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Personal (HR)</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Mitarbeiter'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-navy-400">Mitarbeiter</p>
          <p className="text-2xl font-bold text-navy-900">{employees.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-navy-400">Gehaltskosten/Monat</p>
          <p className="text-2xl font-bold text-navy-900">{totalSalary.toFixed(2)} €</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-navy-400">Gehaltskosten/Jahr</p>
          <p className="text-2xl font-bold text-navy-900">{(totalSalary * 12).toFixed(2)} €</p>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="p-5">
          <h3 className="font-semibold text-navy-800 mb-3">Neuer Mitarbeiter</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Name *" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
            <input placeholder="E-Mail" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
            <input placeholder="Position" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
            <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
              {departments.map(d => <option key={d} value={d}>{deptLabels[d]}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Gehalt/Monat (€)" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
            <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <Button variant="primary" size="sm" onClick={addEmployee} className="mt-3">Speichern</Button>
        </Card>
      )}

      {/* Employee List */}
      {loading ? (
        <div className="text-center py-12 text-navy-400">Laden...</div>
      ) : employees.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Keine Mitarbeiter angelegt.</p></Card>
      ) : (
        <div className="space-y-2">
          {employees.map(e => (
            <Card key={e.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy-900">{e.full_name}</p>
                  <p className="text-sm text-navy-400">
                    {e.position || '–'} · {deptLabels[e.department] || e.department}
                    {e.email && ` · ${e.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-navy-800">{e.salary ? `${e.salary} €/M` : '–'}</span>
                  <button onClick={() => removeEmployee(e.id)} className="text-red-400 hover:text-red-600 text-sm cursor-pointer">✕</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
