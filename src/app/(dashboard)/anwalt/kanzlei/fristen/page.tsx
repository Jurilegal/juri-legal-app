'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Deadline { id: string; title: string; due_date: string; priority: string; completed: boolean; case_title?: string; case_id: string | null; notes: string | null }
interface Task { id: string; title: string; status: string; priority: string; due_date: string | null; case_title?: string }

const priorityMap: Record<string, { label: string; variant: 'error' | 'warning' | 'neutral' | 'success' }> = {
  critical: { label: 'Kritisch', variant: 'error' }, high: { label: 'Hoch', variant: 'warning' },
  normal: { label: 'Normal', variant: 'neutral' }, low: { label: 'Niedrig', variant: 'success' },
}

export default function FristenPage() {
  const supabase = createClient()
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'fristen' | 'aufgaben'>('fristen')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'normal', notes: '' })
  const [taskForm, setTaskForm] = useState({ title: '', due_date: '', priority: 'normal', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: dl }, { data: tk }] = await Promise.all([
      supabase.from('deadlines').select('*, cases(title)').eq('user_id', user.id).order('due_date'),
      supabase.from('kanzlei_tasks').select('*, cases(title)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setDeadlines((dl || []).map((d: Record<string, unknown>) => ({ ...d, case_title: (d.cases as { title: string } | null)?.title })) as Deadline[])
    setTasks((tk || []).map((t: Record<string, unknown>) => ({ ...t, case_title: (t.cases as { title: string } | null)?.title })) as Task[])
    setLoading(false)
  }

  async function addDeadline() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('deadlines').insert({ ...form, user_id: user.id })
    setForm({ title: '', due_date: '', priority: 'normal', notes: '' }); setShowForm(false); setSaving(false); loadAll()
  }

  async function addTask() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('kanzlei_tasks').insert({ title: taskForm.title, due_date: taskForm.due_date || null, priority: taskForm.priority, description: taskForm.description, user_id: user.id })
    setTaskForm({ title: '', due_date: '', priority: 'normal', description: '' }); setShowForm(false); setSaving(false); loadAll()
  }

  async function toggleDeadline(id: string, completed: boolean) {
    await supabase.from('deadlines').update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq('id', id)
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, completed: !completed } : d))
  }

  async function toggleTask(id: string, status: string) {
    const newStatus = status === 'done' ? 'open' : 'done'
    await supabase.from('kanzlei_tasks').update({ status: newStatus }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['fristen', 'aufgaben'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setShowForm(false) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${tab === t ? 'bg-navy-800 text-white' : 'bg-navy-100 text-navy-500'}`}>
              {t === 'fristen' ? '📅 Fristen' : '✅ Aufgaben'}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>+ {tab === 'fristen' ? 'Frist' : 'Aufgabe'}</Button>
      </div>

      {showForm && tab === 'fristen' && (
        <Card className="p-6"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Input label="Titel *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Fällig am *" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          <div><label className="text-sm text-navy-400 block mb-1">Priorität</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm w-full">
            <option value="low">Niedrig</option><option value="normal">Normal</option><option value="high">Hoch</option><option value="critical">Kritisch</option>
          </select></div>
        </div><Button variant="primary" size="sm" onClick={addDeadline} loading={saving} disabled={!form.title.trim() || !form.due_date}>Frist anlegen</Button></Card>
      )}

      {showForm && tab === 'aufgaben' && (
        <Card className="p-6"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Input label="Titel *" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Fällig am" type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
        </div><Button variant="primary" size="sm" onClick={addTask} loading={saving} disabled={!taskForm.title.trim()}>Aufgabe anlegen</Button></Card>
      )}

      {tab === 'fristen' ? (
        deadlines.length === 0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Fristen.</p></Card> : (
          <div className="space-y-2">{deadlines.map(d => {
            const overdue = !d.completed && d.due_date < today
            const p = priorityMap[d.priority] || priorityMap.normal
            return (
              <Card key={d.id} className={`p-4 ${overdue ? 'border-red-300 bg-red-50/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={d.completed} onChange={() => toggleDeadline(d.id, d.completed)} className="w-5 h-5 rounded cursor-pointer" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${d.completed ? 'line-through text-navy-400' : 'text-navy-800'}`}>{d.title}</span>
                      <Badge variant={p.variant}>{p.label}</Badge>
                      {overdue && <span className="text-xs text-red-500 font-medium">ÜBERFÄLLIG</span>}
                    </div>
                    <p className="text-xs text-navy-400 mt-0.5">{new Date(d.due_date).toLocaleDateString('de-DE')}{d.case_title ? ` · ${d.case_title}` : ''}</p>
                  </div>
                </div>
              </Card>
            )
          })}</div>
        )
      ) : (
        tasks.length === 0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Aufgaben.</p></Card> : (
          <div className="space-y-2">{tasks.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTask(t.id, t.status)} className="w-5 h-5 rounded cursor-pointer" />
                <div className="flex-1">
                  <span className={`font-medium ${t.status === 'done' ? 'line-through text-navy-400' : 'text-navy-800'}`}>{t.title}</span>
                  {t.due_date && <p className="text-xs text-navy-400">{new Date(t.due_date).toLocaleDateString('de-DE')}{t.case_title ? ` · ${t.case_title}` : ''}</p>}
                </div>
              </div>
            </Card>
          ))}</div>
        )
      )}
    </div>
  )
}
