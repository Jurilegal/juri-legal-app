'use client'
import { Suspense } from 'react'
import { TabPage } from '@/components/ui/TabPage'

import ProfilPage from '../profil/page'
import DokumentePage from '../dokumente/page'
import PreisePage from '../preise/page'
import EinnahmenPage from '../einnahmen/page'

const Spinner = () => <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

const tabs = [
  { id: 'profil', label: 'Öffentliches Profil', icon: '👤', component: <Suspense fallback={<Spinner/>}><ProfilPage/></Suspense> },
  { id: 'dokumente', label: 'Dokumente & Verifizierung', icon: '📄', component: <Suspense fallback={<Spinner/>}><DokumentePage/></Suspense> },
  { id: 'preise', label: 'Preisgestaltung', icon: '💰', component: <Suspense fallback={<Spinner/>}><PreisePage/></Suspense> },
  { id: 'einnahmen', label: 'Einnahmen & Historie', icon: '📈', component: <Suspense fallback={<Spinner/>}><EinnahmenPage/></Suspense> },
]

export default function ProfilFinanzenPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-navy-900">👤 Profil & Finanzen</h2>
        <p className="text-sm text-navy-400">Ihr öffentliches Profil, Dokumente, Preise und Einnahmen</p>
      </div>
      <Suspense fallback={<Spinner/>}>
        <TabPage tabs={tabs} basePath="/anwalt/profil-finanzen" defaultTab="profil" />
      </Suspense>
    </div>
  )
}
