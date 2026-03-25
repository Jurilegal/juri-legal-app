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
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
    supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('session_payments').select('amount_captured, platform_fee').eq('status', 'captured'),
    supabase.from('payout_periods').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
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
          {(activeSessions || 0) > 0 && (
            <p className="text-xs text-emerald-500 mt-1">🟢 {activeSessions} aktiv</p>
          )}
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Bewertungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{totalReviews || 0}</p>
        </Card>
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
        <Card className="p-6 border-gold-200 bg-gold-50/30">
          <p className="text-sm text-navy-400">Offene Aktionen</p>
          <div className="mt-2 space-y-1">
            {(pendingLawyers || 0) > 0 && (
              <Link href="/admin/verifizierung" className="text-sm text-gold-600 hover:underline block">
                ⚠️ {pendingLawyers} Verifizierungen
              </Link>
            )}
            {(pendingPayouts || 0) > 0 && (
              <Link href="/admin/auszahlungen" className="text-sm text-gold-600 hover:underline block">
                💰 {pendingPayouts} Auszahlungen
              </Link>
            )}
            {!(pendingLawyers || 0) && !(pendingPayouts || 0) && (
              <p className="text-sm text-emerald-600">✓ Alles erledigt</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/verifizierung">
          <Card className="p-6 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-semibold text-navy-800">Anwalts-Verifizierung</p>
                <p className="text-sm text-navy-400">Dokumente prüfen & Anwälte freischalten</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/auszahlungen">
          <Card className="p-6 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold text-navy-800">Auszahlungen</p>
                <p className="text-sm text-navy-400">Rechnungen prüfen & Auszahlungen freigeben</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
