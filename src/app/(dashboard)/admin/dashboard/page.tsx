import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: pendingLawyers },
    { count: approvedLawyers },
    { count: totalSessions },
    { count: activeSessions },
    { count: totalReviews },
    { data: revenueData },
    { count: pendingPayouts },
    { data: expiringContracts },
    { count: employeeCount },
    { count: activeCampaigns },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
    supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('session_payments').select('amount_captured, platform_fee').eq('status', 'captured'),
    supabase.from('payout_periods').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('contracts').select('id, partner_name, end_date').lte('end_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gte('end_date', new Date().toISOString().split('T')[0]),
    supabase.from('employees').select('*', { count: 'exact', head: true }),
    supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'aktiv'),
  ])

  const totalRevenue = (revenueData || []).reduce((s, r) => s + (r.platform_fee || 0), 0)
  const totalVolume = (revenueData || []).reduce((s, r) => s + (r.amount_captured || 0), 0)

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-navy-400">Nutzer gesamt</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{totalUsers || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Verifizierte Anwälte</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedLawyers || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Beratungen gesamt</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{totalSessions || 0}</p>
          {(activeSessions || 0) > 0 && <p className="text-xs text-emerald-500 mt-1">🟢 {activeSessions} aktiv</p>}
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Bewertungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{totalReviews || 0}</p>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-navy-800 to-navy-900 text-white">
          <p className="text-sm text-navy-300">Umsatzvolumen (30 Tage)</p>
          <p className="text-2xl font-bold mt-1">{(totalVolume / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-gold-400 to-gold-500 text-white">
          <p className="text-sm text-gold-100">Plattform-Einnahmen (5%)</p>
          <p className="text-2xl font-bold mt-1">{(totalRevenue / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Unternehmen</p>
          <div className="mt-1 space-y-1 text-sm">
            <p className="text-navy-700">👥 {employeeCount || 0} Mitarbeiter</p>
            <p className="text-navy-700">📢 {activeCampaigns || 0} aktive Kampagnen</p>
          </div>
        </Card>
      </div>

      {/* Task Queue */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">⚡ Aufgaben-Warteschlange</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(pendingLawyers || 0) > 0 && (
            <Link href="/admin/verifizierung" className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 hover:shadow-md transition-all">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-semibold text-amber-800">{pendingLawyers} Verifizierungen</p>
                <p className="text-xs text-amber-600">Anwälte warten auf Prüfung</p>
              </div>
            </Link>
          )}
          {(pendingPayouts || 0) > 0 && (
            <Link href="/admin/auszahlungen" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-all">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold text-blue-800">{pendingPayouts} Auszahlungen</p>
                <p className="text-xs text-blue-600">Warten auf Freigabe</p>
              </div>
            </Link>
          )}
          {(expiringContracts || []).length > 0 && (
            <Link href="/admin/vertraege" className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-all">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-orange-800">{expiringContracts?.length} Verträge</p>
                <p className="text-xs text-orange-600">Laufen in 30 Tagen aus</p>
              </div>
            </Link>
          )}
          {!(pendingLawyers || 0) && !(pendingPayouts || 0) && !(expiringContracts || []).length && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 col-span-full">
              <p className="text-emerald-700 font-medium">✅ Alles erledigt — keine offenen Aufgaben</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: '/admin/konten', icon: '👥', label: 'Konten' },
          { href: '/admin/verifizierung', icon: '🛡️', label: 'Verifizierung' },
          { href: '/admin/finanzen', icon: '📊', label: 'Finanzen' },
          { href: '/admin/personal', icon: '🏢', label: 'Personal' },
          { href: '/admin/vertraege', icon: '📄', label: 'Verträge' },
          { href: '/admin/marketing', icon: '📢', label: 'Marketing' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="p-4 text-center hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-sm font-medium text-navy-700 mt-1">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
