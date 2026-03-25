import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function MandantDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-navy-400">Beratungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Ausgaben gesamt</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">0,00 €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Bewertungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">0</p>
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
