import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'

export default async function MandantDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: sessionCount },
    { count: reviewCount },
    { data: payments },
    { data: freeMinData },
  ] = await Promise.all([
    supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('mandant_id', user!.id),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('mandant_id', user!.id),
    supabase.from('session_payments').select('amount_captured').eq('mandant_id', user!.id).eq('status', 'captured'),
    supabase.rpc('get_free_minutes_balance', { uid: user!.id }),
  ])

  const totalSpent = (payments || []).reduce((s, p) => s + (p.amount_captured || 0), 0)
  const freeMinutes = (freeMinData as unknown as number) || 0

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-navy-400">Beratungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{sessionCount || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Ausgaben gesamt</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{(totalSpent / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Bewertungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{reviewCount || 0}</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-gold-50 to-gold-100 border-gold-200">
          <p className="text-sm text-gold-600">Freiminuten</p>
          <p className="text-2xl font-bold text-gold-700 mt-1">{freeMinutes} Min.</p>
          <p className="text-xs text-gold-500 mt-1">Geschenkt bei Registrierung & Bewertungen</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Sofort loslegen</h2>
        <p className="text-navy-500 mb-4">Finden Sie einen verfügbaren Anwalt und starten Sie Ihre erste Beratung.</p>
        <Link
          href="/anwaelte"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-800 text-white font-semibold rounded-xl hover:from-navy-800 hover:to-navy-900 shadow-lg shadow-navy-800/25 transition-all duration-200"
        >
          Anwälte finden
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </Card>
    </div>
  )
}
