'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function DatevPage() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [exporting, setExporting] = useState(false)

  async function exportDatev() {
    setExporting(true)
    window.open(`/api/anwalt/datev-export?from=${dateFrom}&to=${dateTo}`, '_blank')
    setTimeout(() => setExporting(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-navy-800">DATEV-Export</h2>
      <Card className="p-6">
        <p className="text-sm text-navy-500 mb-4">Exportieren Sie alle abrechnungsrelevanten Daten im offiziellen DATEV-Format für Ihren Steuerberater.</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="text-sm text-navy-400 block mb-1">Von</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm" /></div>
          <div><label className="text-sm text-navy-400 block mb-1">Bis</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm" /></div>
        </div>
        <Button variant="primary" onClick={exportDatev} loading={exporting}>📥 DATEV-CSV herunterladen</Button>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-2">Was wird exportiert?</h3>
        <ul className="text-sm text-navy-500 space-y-1">
          <li>✅ Alle Rechnungen im Zeitraum</li>
          <li>✅ Zeiteinträge mit Stundensätzen</li>
          <li>✅ Mandanten-Stammdaten</li>
          <li>✅ Umsatzsteuer-Berechnung</li>
        </ul>
        <p className="text-xs text-navy-300 mt-4">Format: DATEV Buchungsstapel (CSV) — kompatibel mit DATEV Unternehmen online.</p>
      </Card>
    </div>
  )
}
