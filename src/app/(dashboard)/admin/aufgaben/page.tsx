'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Task {
  id: string; title: string; description: string; status: string; module: string
  related_entity_id: string; related_entity_type: string; assigned_admin_id: string | null
  created_at: string; completed_at: string | null
}

type TabKey = 'open' | 'pending' | 'completed' | 'all'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  open: { label: 'Offen', variant: 'warning' },
  in_progress: { label: 'In Bearbeitung', variant: 'warning' },
  pending_approval: { label: 'Wartet auf Freigabe', variant: 'error' },
  completed: { label: 'Erledigt', variant: 'success' },
  failed: { label: 'Fehlgeschlagen', variant: 'error' },
}

const moduleLabels: Record<string, string> = {
  accounts: '👥 Konten', finance: '💰 Finanzen', contracts: '📄 Verträge', hr: '🏢 Personal', marketing: '📢 Marketing'
}

export default function AufgabenPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<TabKey>('open')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setUserRole(p?.role || '')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadTasks() }, [tab])

  async function loadTasks() {
    setLoading(true)
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

    if (tab === 'open') query = query.in('status', ['open', 'in_progress'])
    else if (tab === 'pending') query = query.eq('status', 'pending_approval')
    else if (tab === 'completed') query = query.eq('status', 'completed')

    const { data } = await query
    setTasks((data || []) as Task[])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'completed') update.completed_at = new Date().toISOString()
    await supabase.from('tasks').update(update).eq('id', id)
    loadTasks()
  }

  function getEntityLink(task: Task): string | null {
    if (task.related_entity_type === 'lawyer') return `/admin/konten/anwalt/${task.related_entity_id}`
    if (task.related_entity_type === 'mandant') return `/admin/konten/mandant/${task.related_entity_id}`
    if (task.related_entity_type === 'contract') return '/admin/vertraege'
    return null
  }

  const isSuperAdmin = userRole === 'super_admin'

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Aufgaben & Prozesse</h2>

      <div className="flex gap-1 bg-navy-100 rounded-xl p-1 w-fit">
        {([
          { key: 'open' as TabKey, label: 'Offen' },
          { key: 'pending' as TabKey, label: 'Freigabe' },
          { key: 'completed' as TabKey, label: 'Erledigt' },
          { key: 'all' as TabKey, label: 'Alle' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${tab === t.key ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Laden...</div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-navy-400">Keine Aufgaben in dieser Kategorie.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const st = statusConfig[task.status] || statusConfig.open
            const link = getEntityLink(task)
            return (
              <Card key={task.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-900">{task.title}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-navy-400">{moduleLabels[task.module] || task.module}</span>
                    </div>
                    {task.description && <p className="text-sm text-navy-500 mt-1">{task.description}</p>}
                    <p className="text-xs text-navy-300 mt-2">
                      Erstellt: {new Date(task.created_at).toLocaleDateString('de-DE')}
                      {task.completed_at && ` · Erledigt: ${new Date(task.completed_at).toLocaleDateString('de-DE')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {link && (
                      <Link href={link}>
                        <Button variant="outline" size="sm">Ansehen</Button>
                      </Link>
                    )}
                    {task.status === 'open' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(task.id, 'in_progress')}>Starten</Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(task.id, 'pending_approval')}>Zur Freigabe</Button>
                    )}
                    {task.status === 'pending_approval' && isSuperAdmin && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(task.id, 'completed')}>✓ Freigeben</Button>
                    )}
                    {task.status === 'pending_approval' && !isSuperAdmin && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Nur Super-Admin</span>
                    )}
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
