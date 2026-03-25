'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface TimeEntry { id: string; description: string; duration_minutes: number; hourly_rate: number | null; date: string; billable: boolean; invoiced: boolean; case_title?: string }

export default function ZeiterfassungPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ description: '', duration_minutes: '', hourly_rate: '250', date: new Date().toISOString().split('T')[0], billable: true })
  const [saving, setSaving] = useState(false)
  // Timer
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerDesc, setTimerDesc] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { loadEntries() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timerRunning) { intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000) }
    else if (intervalRef.current) clearInterval(intervalRef.current)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerRunning])

  async function loadEntries() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('time_entries').select('*, cases(title)').eq('user_id', user.id).order('date', { ascending: false }).limit(100)
    setEntries((data || []).map((e: Record<string, unknown>) => ({ ...e, case_title: (e.cases as { title: string } | null)?.title })) as TimeEntry[])
    setLoading(false)
  }

  async function addEntry() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('time_entries').insert({
      description: form.description, duration_minutes: parseInt(form.duration_minutes),
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      date: form.date, billable: form.billable, user_id: user.id,
    })
    setForm(f => ({ ...f, description: '', duration_minutes: '' })); setSaving(false); loadEntries()
  }

  async function stopTimer() {
    setTimerRunning(false)
    if (timerSeconds < 60) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('time_entries').insert({
      description: timerDesc || 'Timer-Eintrag', duration_minutes: Math.ceil(timerSeconds / 60),
      hourly_rate: 250, date: new Date().toISOString().split('T')[0], billable: true, user_id: user.id,
    })
    setTimerSeconds(0); setTimerDesc(''); loadEntries()
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const totalMinutes = entries.filter(e => e.billable && !e.invoiced).reduce((s, e) => s + e.duration_minutes, 0)
  const totalRevenue = entries.filter(e => e.billable && !e.invoiced).reduce((s, e) => s + (e.duration_minutes / 60) * (e.hourly_rate || 250), 0)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Zeiterfassung</h2>

      {/* Timer */}
      <Card className="p-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-navy-300">Live-Timer</p>
            <p className="text-4xl font-mono font-bold mt-1">{formatTime(timerSeconds)}</p>
          </div>
          <div className="flex items-center gap-3">
            <input value={timerDesc} onChange={e => setTimerDesc(e.target.value)} placeholder="Tätigkeit..." className="px-3 py-2 rounded-lg bg-navy-700 text-white border border-navy-600 text-sm placeholder:text-navy-400 w-48" />
            {timerRunning ? (
              <button onClick={stopTimer} className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium cursor-pointer hover:bg-red-600">⏹ Stopp</button>
            ) : (
              <button onClick={() => setTimerRunning(true)} className="px-6 py-2 bg-gold-400 text-navy-900 rounded-xl font-medium cursor-pointer hover:bg-gold-500">▶ Start</button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5"><p className="text-sm text-navy-400">Offene Stunden</p><p className="text-2xl font-bold text-navy-900">{(totalMinutes / 60).toFixed(1)} h</p></Card>
        <Card className="p-5"><p className="text-sm text-navy-400">Offener Umsatz</p><p className="text-2xl font-bold text-gold-600">{totalRevenue.toFixed(2)} €</p></Card>
      </div>

      {/* Manual Entry */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Manuelle Erfassung</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <Input label="Tätigkeit *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Input label="Dauer (Min.) *" type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
          <Input label="Stundensatz (€)" type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} />
          <Input label="Datum" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <Button variant="primary" size="sm" onClick={addEntry} loading={saving} disabled={!form.description.trim() || !form.duration_minutes}>Eintrag speichern</Button>
      </Card>

      {/* Entries */}
      {entries.length === 0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Zeiteinträge.</p></Card> : (
        <div className="space-y-2">{entries.map(e => (
          <Card key={e.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy-800">{e.description}</p>
                <p className="text-xs text-navy-400">{new Date(e.date).toLocaleDateString('de-DE')} · {e.duration_minutes} Min.{e.case_title ? ` · ${e.case_title}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy-900">{((e.duration_minutes / 60) * (e.hourly_rate || 250)).toFixed(2)} €</p>
                <p className="text-xs text-navy-400">{e.billable ? 'Abrechenbar' : 'Nicht abr.'}{e.invoiced ? ' · Abgerechnet' : ''}</p>
              </div>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
