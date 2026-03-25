'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

type Tab = 'anwaelte' | 'mandanten'

interface UserRow {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  verification_status?: string
  total_consultations?: number
}

export default function KontenPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('anwaelte')
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (tab === 'anwaelte') {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, created_at')
          .eq('role', 'anwalt')
          .order('created_at', { ascending: false })

        const ids = (data || []).map(u => u.id)
        const { data: lawyers } = await supabase
          .from('lawyer_profiles')
          .select('user_id, verification_status, total_consultations')
          .in('user_id', ids)

        const lMap = new Map((lawyers || []).map(l => [l.user_id, l]))
        setUsers((data || []).map(u => {
          const l = lMap.get(u.id)
          return { ...u, verification_status: l?.verification_status, total_consultations: l?.total_consultations || 0 }
        }))
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, created_at')
          .eq('role', 'mandant')
          .order('created_at', { ascending: false })
        setUsers(data || [])
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Kontenverwaltung</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-navy-100 rounded-xl p-1">
          {(['anwaelte', 'mandanten'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${tab === t ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-700'}`}>
              {t === 'anwaelte' ? 'Anwälte' : 'Mandanten'}
            </button>
          ))}
        </div>
        <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Laden...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Keine Einträge.</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <Link key={u.id} href={tab === 'anwaelte' ? `/admin/konten/anwalt/${u.id}` : `/admin/konten/mandant/${u.id}`}>
              <Card className="p-4 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{u.first_name} {u.last_name}</span>
                      {u.verification_status === 'approved' && <Badge variant="success">Verifiziert</Badge>}
                      {u.verification_status === 'pending' && <Badge variant="warning">Ausstehend</Badge>}
                      {u.verification_status === 'rejected' && <Badge variant="error">Abgelehnt</Badge>}
                    </div>
                    <p className="text-sm text-navy-400">{u.email}</p>
                  </div>
                  <div className="text-sm text-navy-400">
                    {new Date(u.created_at).toLocaleDateString('de-DE')}
                    {u.total_consultations !== undefined && ` · ${u.total_consultations} Beratungen`}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
