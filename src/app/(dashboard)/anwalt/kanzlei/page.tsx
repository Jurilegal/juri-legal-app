'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Stats { cases: number; openCases: number; deadlines: number; overdueDeadlines: number; unbilledMinutes: number; unbilledRevenue: number; clients: number; invoicesDraft: number }

const modules = [
  { href: '/anwalt/kanzlei/akten', icon: '📁', title: 'Digitale Akten', desc: 'Akten verwalten, Dokumente hochladen' },
  { href: '/anwalt/kanzlei/mandanten', icon: '👥', title: 'Mandanten', desc: 'Mandanten-Stammdaten verwalten' },
  { href: '/anwalt/kanzlei/fristen', icon: '📅', title: 'Fristen & Aufgaben', desc: 'Fristen überwachen, Aufgaben planen' },
  { href: '/anwalt/kanzlei/zeiterfassung', icon: '⏱️', title: 'Zeiterfassung', desc: 'Zeiten erfassen, Timer starten' },
  { href: '/anwalt/kanzlei/rechnungen', icon: '🧾', title: 'Rechnungen', desc: 'Rechnungen erstellen und verwalten' },
  { href: '/anwalt/kanzlei/recherche', icon: '⚖️', title: 'Recherche', desc: 'Juristische Datenbank durchsuchen' },
  { href: '/anwalt/kanzlei/bea', icon: '✉️', title: 'beA-Postfach', desc: 'Elektronischer Rechtsverkehr' },
  { href: '/anwalt/kanzlei/datev', icon: '📥', title: 'DATEV-Export', desc: 'Buchhaltungsdaten exportieren' },
]

export default function KanzleiOverview() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({ cases: 0, openCases: 0, deadlines: 0, overdueDeadlines: 0, unbilledMinutes: 0, unbilledRevenue: 0, clients: 0, invoicesDraft: 0 })
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<string>('basic')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        supabase.from('cases').select('status', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('deadlines').select('due_date,completed', { count: 'exact' }).eq('user_id', user.id).eq('completed', false),
        supabase.from('time_entries').select('duration_minutes,hourly_rate').eq('user_id', user.id).eq('billable', true).eq('invoiced', false),
        supabase.from('kanzlei_clients').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('kanzlei_invoices').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'draft'),
        supabase.from('subscriptions').select('tier_id').eq('user_id', user.id).single(),
      ])
      const cases = r1.count || 0
      const openCases = (r1.data || []).filter((c: Record<string, string>) => c.status === 'open' || c.status === 'in_progress').length
      const deadlines = r2.count || 0
      const overdueDeadlines = (r2.data || []).filter((d: Record<string, string>) => d.due_date < today).length
      const entries = (r3.data || []) as Array<{ duration_minutes: number; hourly_rate: number | null }>
      const unbilledMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0)
      const unbilledRevenue = entries.reduce((s, e) => s + (e.duration_minutes / 60) * (e.hourly_rate || 250), 0)
      setStats({ cases, openCases, deadlines, overdueDeadlines, unbilledMinutes, unbilledRevenue, clients: r4.count || 0, invoicesDraft: r5.count || 0 })
      if (r6.data) setSub(r6.data.tier_id)
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Kanzlei-Dashboard</h2>
        <Badge variant={sub === 'all-in-one' ? 'success' : 'warning'}>{sub === 'all-in-one' ? 'All-in-One' : 'Basic'}</Badge>
      </div>

      {sub === 'basic' && (
        <Card className="p-5 bg-gradient-to-r from-gold-50 to-amber-50 border-gold-200">
          <div className="flex items-center justify-between">
            <div><p className="font-semibold text-navy-800">Upgrade auf All-in-One</p><p className="text-sm text-navy-500">Alle Kanzlei-Module freischalten — 149 €/Monat</p></div>
            <Link href="/anwalt/abo" className="px-4 py-2 bg-gold-400 text-white rounded-xl text-sm font-medium hover:bg-gold-500">Jetzt upgraden →</Link>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Akten</p><p className="text-2xl font-bold text-navy-900">{stats.cases}</p><p className="text-xs text-navy-400">{stats.openCases} offen</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Fristen</p><p className="text-2xl font-bold text-navy-900">{stats.deadlines}</p>
          {stats.overdueDeadlines > 0 && <p className="text-xs text-red-500 font-medium">{stats.overdueDeadlines} überfällig!</p>}
        </Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Offene Stunden</p><p className="text-2xl font-bold text-navy-900">{(stats.unbilledMinutes / 60).toFixed(1)} h</p><p className="text-xs text-gold-600">{stats.unbilledRevenue.toFixed(0)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Mandanten</p><p className="text-2xl font-bold text-navy-900">{stats.clients}</p><p className="text-xs text-navy-400">{stats.invoicesDraft} Rechnungsentwürfe</p></Card>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(m => (
          <Link key={m.href} href={m.href}>
            <Card className="p-5 hover:border-gold-300 hover:shadow-md transition-all h-full">
              <span className="text-3xl block mb-2">{m.icon}</span>
              <h3 className="font-semibold text-navy-800">{m.title}</h3>
              <p className="text-xs text-navy-400 mt-1">{m.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
