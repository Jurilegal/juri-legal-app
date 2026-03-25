import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'

const moduleLabels: Record<string, { label: string; icon: string }> = {
  accounts: { label: 'Konten', icon: '👥' },
  finance: { label: 'Finanzen', icon: '💰' },
  contracts: { label: 'Verträge', icon: '📄' },
  hr: { label: 'Personal', icon: '🏢' },
  marketing: { label: 'Marketing', icon: '📢' },
}

const taskStatusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  open: { label: 'Offen', variant: 'warning' },
  in_progress: { label: 'In Bearbeitung', variant: 'warning' },
  pending_approval: { label: 'Freigabe', variant: 'error' },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: pendingLawyers } = await supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
  const { count: approvedLawyers } = await supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved')
  const { count: totalSessions } = await supabase.from('consultation_sessions').select('*', { count: 'exact', head: true })
  const { count: activeSessions } = await supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { data: revenueData } = await supabase.from('session_payments').select('amount_captured, platform_fee').eq('status', 'captured')
  const { count: employeeCount } = await supabase.from('employees').select('*', { count: 'exact', head: true })
  const { count: activeCampaigns } = await supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'aktiv')
  const { data: openTasks } = await supabase.from('tasks').select('id, title, status, module, related_entity_id, related_entity_type, created_at').in('status', ['open', 'in_progress', 'pending_approval']).order('created_at', { ascending: false }).limit(10)
  const { data: allTasks } = await supabase.from('tasks').select('module, status')
  const { data: expiringContracts } = await supabase.from('contracts').select('id, partner_name, end_date').lte('end_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gte('end_date', new Date().toISOString().split('T')[0])

  const totalRevenue = (revenueData || []).reduce((s, r) => s + (r.platform_fee || 0), 0)
  const totalVolume = (revenueData || []).reduce((s, r) => s + (r.amount_captured || 0), 0)

  // Module roadmap stats
  const moduleStats: Record<string, { total: number; completed: number }> = {}
  for (const t of (allTasks || [])) {
    if (!moduleStats[t.module]) moduleStats[t.module] = { total: 0, completed: 0 }
    moduleStats[t.module].total++
    if (t.status === 'completed') moduleStats[t.module].completed++
  }

  return (
    <div className="space-y-8">
      {/* To-Do Section */}
      {(openTasks || []).length > 0 && (
        <Card className="p-6 border-gold-200 bg-gradient-to-r from-gold-50/50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy-800">📋 Deine To-Dos heute</h2>
            <Link href="/admin/aufgaben" className="text-sm text-gold-600 hover:underline">Alle anzeigen →</Link>
          </div>
          <div className="space-y-2">
            {(openTasks || []).slice(0, 5).map(task => {
              const st = taskStatusLabels[task.status] || taskStatusLabels.open
              const mod = moduleLabels[task.module]
              return (
                <Link key={task.id} href="/admin/aufgaben" className="flex items-center justify-between p-3 bg-white rounded-xl border border-navy-100 hover:border-gold-300 transition-all">
                  <div className="flex items-center gap-3">
                    <span>{mod?.icon || '📌'}</span>
                    <span className="text-sm font-medium text-navy-800">{task.title}</span>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6"><p className="text-sm text-navy-400">Nutzer gesamt</p><p className="text-2xl font-bold text-navy-900 mt-1">{totalUsers || 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-navy-400">Verifizierte Anwälte</p><p className="text-2xl font-bold text-emerald-600 mt-1">{approvedLawyers || 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-navy-400">Beratungen</p><p className="text-2xl font-bold text-navy-900 mt-1">{totalSessions || 0}</p>{(activeSessions || 0) > 0 && <p className="text-xs text-emerald-500 mt-1">🟢 {activeSessions} aktiv</p>}</Card>
        <Card className="p-6"><p className="text-sm text-navy-400">Unternehmen</p><div className="mt-1 text-sm"><p className="text-navy-700">👥 {employeeCount || 0} Mitarbeiter</p><p className="text-navy-700">📢 {activeCampaigns || 0} Kampagnen</p></div></Card>
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-navy-800 to-navy-900 text-white">
          <p className="text-sm text-navy-300">Umsatzvolumen</p>
          <p className="text-2xl font-bold mt-1">{(totalVolume / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-gold-400 to-gold-500 text-white">
          <p className="text-sm text-gold-100">Plattform-Einnahmen (5%)</p>
          <p className="text-2xl font-bold mt-1">{(totalRevenue / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Offene Aufgaben</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{(openTasks || []).length}</p>
          {(openTasks || []).filter(t => t.status === 'pending_approval').length > 0 && (
            <p className="text-xs text-red-500 mt-1">⚠️ {(openTasks || []).filter(t => t.status === 'pending_approval').length} warten auf Freigabe</p>
          )}
        </Card>
      </div>

      {/* Module Roadmaps */}
      {Object.keys(moduleStats).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-navy-800 mb-4">📊 Modul-Fortschritt</h2>
          <div className="space-y-4">
            {Object.entries(moduleStats).map(([mod, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
              const info = moduleLabels[mod] || { label: mod, icon: '📌' }
              return (
                <div key={mod}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-navy-700">{info.icon} {info.label}</span>
                    <span className="text-xs text-navy-400">{stats.completed}/{stats.total} erledigt ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : pct > 50 ? 'bg-gold-400' : 'bg-navy-300'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Task Queue */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">⚡ Warteschlange</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(pendingLawyers || 0) > 0 && (
            <Link href="/admin/verifizierung" className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 hover:shadow-md transition-all">
              <span className="text-2xl">🛡️</span>
              <div><p className="font-semibold text-amber-800">{pendingLawyers} Verifizierungen</p><p className="text-xs text-amber-600">Anwälte warten auf Prüfung</p></div>
            </Link>
          )}
          {(expiringContracts || []).length > 0 && (
            <Link href="/admin/vertraege" className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-all">
              <span className="text-2xl">📄</span>
              <div><p className="font-semibold text-orange-800">{expiringContracts?.length} Verträge</p><p className="text-xs text-orange-600">Laufen in 30 Tagen aus</p></div>
            </Link>
          )}
          {!(pendingLawyers || 0) && !(expiringContracts || []).length && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 col-span-full">
              <p className="text-emerald-700 font-medium">✅ Alles erledigt</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { href: '/admin/aufgaben', icon: '📋', label: 'Aufgaben' },
          { href: '/admin/konten', icon: '👥', label: 'Konten' },
          { href: '/admin/verifizierung', icon: '🛡️', label: 'Verifizierung' },
          { href: '/admin/finanzen', icon: '📊', label: 'Finanzen' },
          { href: '/admin/auszahlungen', icon: '💳', label: 'Auszahlungen' },
          { href: '/admin/personal', icon: '🏢', label: 'Personal' },
          { href: '/admin/vertraege', icon: '📄', label: 'Verträge' },
          { href: '/admin/marketing', icon: '📢', label: 'Marketing' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="p-3 text-center hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
              <span className="text-xl">{item.icon}</span>
              <p className="text-xs font-medium text-navy-700 mt-1">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
