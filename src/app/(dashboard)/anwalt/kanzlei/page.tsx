'use client'
import { Suspense, lazy } from 'react'
import { TabPage } from '@/components/ui/TabPage'

// Lazy load tab content from existing pages
import AktenPage from './akten/page'
import FristenPage from './fristen/page'
import ZeiterfassungPage from './zeiterfassung/page'
import BeAPage from './bea/page'
import DATEVPage from './datev/page'

const Spinner = () => <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

const tabs = [
  { id: 'akten', label: 'Akten', icon: '📁', component: <Suspense fallback={<Spinner/>}><AktenPage/></Suspense> },
  { id: 'fristen', label: 'Fristen & Kalender', icon: '📅', component: <Suspense fallback={<Spinner/>}><FristenPage/></Suspense> },
  { id: 'zeiterfassung', label: 'Zeiterfassung & Abrechnung', icon: '⏱️', component: <Suspense fallback={<Spinner/>}><ZeiterfassungPage/></Suspense> },
  { id: 'bea', label: 'beA Postfach', icon: '📨', component: <Suspense fallback={<Spinner/>}><BeAPage/></Suspense> },
  { id: 'datev', label: 'DATEV Export', icon: '📊', component: <Suspense fallback={<Spinner/>}><DATEVPage/></Suspense> },
]

export default function KanzleiHubPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-navy-900">🏛️ Kanzlei</h2>
        <p className="text-sm text-navy-400">Alle operativen Kanzlei-Tools an einem Ort</p>
      </div>
      <Suspense fallback={<Spinner/>}>
        <TabPage tabs={tabs} basePath="/anwalt/kanzlei" defaultTab="akten" />
      </Suspense>
    </div>
  )
}
