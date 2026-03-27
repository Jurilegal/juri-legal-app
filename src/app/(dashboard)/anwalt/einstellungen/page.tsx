'use client'
import { Suspense } from 'react'
import { TabPage } from '@/components/ui/TabPage'

import VerfuegbarkeitPage from '../verfuegbarkeit/page'
import SupportPage from '../support/page'

const Spinner = () => <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

// Abo page inline since it may not exist as separate page
function AboTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-navy-100">
          <h3 className="font-semibold text-navy-800 mb-2">📦 Basic (Kostenlos)</h3>
          <p className="text-sm text-navy-500 mb-4">Zugang zur Beratungsplattform, Profil, Bewertungen</p>
          <ul className="text-sm text-navy-600 space-y-1">
            <li>✅ Mandanten-Matching</li>
            <li>✅ Chat-Beratung</li>
            <li>✅ Bewertungssystem</li>
            <li>✅ Basis-Profil</li>
          </ul>
        </div>
        <div className="p-6 bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">🏛️ All-in-One</h3>
            <span className="text-gold-400 font-bold">149€/Mo.</span>
          </div>
          <p className="text-sm text-navy-200 mb-4">Komplette Kanzleisoftware mit allen Modulen</p>
          <ul className="text-sm space-y-1">
            <li>✅ Alles aus Basic</li>
            <li>✅ Digitale Aktenführung</li>
            <li>✅ Fristen & Kalender</li>
            <li>✅ Zeiterfassung & RVG</li>
            <li>✅ beA, DATEV, FiBu</li>
            <li>✅ KI-Assistent</li>
            <li>✅ E-Mail-Client</li>
          </ul>
          <p className="text-xs text-gold-300 mt-4">🎉 Early Adopter: Erste 500 Kanzleien = 12 Monate kostenlos!</p>
        </div>
      </div>
    </div>
  )
}

const tabs = [
  { id: 'verfuegbarkeit', label: 'Verfügbarkeit', icon: '📅', component: <Suspense fallback={<Spinner/>}><VerfuegbarkeitPage/></Suspense> },
  { id: 'abo', label: 'Abonnement', icon: '📦', component: <AboTab/> },
  { id: 'support', label: 'Support', icon: '🛟', component: <Suspense fallback={<Spinner/>}><SupportPage/></Suspense> },
]

export default function EinstellungenHubPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-navy-900">⚙️ Einstellungen</h2>
        <p className="text-sm text-navy-400">Verfügbarkeit, Abonnement und Support</p>
      </div>
      <Suspense fallback={<Spinner/>}>
        <TabPage tabs={tabs} basePath="/anwalt/einstellungen" defaultTab="verfuegbarkeit" />
      </Suspense>
    </div>
  )
}
