import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: pendingLawyers } = await supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
  const { count: approvedLawyers } = await supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved')

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-navy-400">Nutzer gesamt</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{totalUsers || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Verifizierte Anwälte</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedLawyers || 0}</p>
        </Card>
        <Card className="p-6 border-gold-200 bg-gold-50/30">
          <p className="text-sm text-navy-400">Ausstehende Verifizierungen</p>
          <p className="text-2xl font-bold text-gold-600 mt-1">{pendingLawyers || 0}</p>
          {(pendingLawyers || 0) > 0 && (
            <Link href="/admin/verifizierung" className="text-sm text-gold-500 hover:underline mt-2 inline-block">
              Jetzt prüfen →
            </Link>
          )}
        </Card>
      </div>
    </div>
  )
}
