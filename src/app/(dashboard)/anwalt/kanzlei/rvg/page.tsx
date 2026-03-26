'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { calculateRVG, type RVGCalculation } from '@/lib/rvg'

export default function RVGPage() {
  const [wert, setWert] = useState('')
  const [type, setType] = useState<'beratung' | 'aussergerichtlich' | 'gericht'>('aussergerichtlich')
  const [result, setResult] = useState<RVGCalculation | null>(null)

  function calc() {
    const v = parseFloat(wert)
    if (!v || v <= 0) return
    setResult(calculateRVG(v, type))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">RVG-Gebührenrechner</h2>
      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-navy-400 block mb-1">Gegenstandswert (€)</label>
            <input type="number" value={wert} onChange={e => setWert(e.target.value)} placeholder="z.B. 10000"
              className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm" />
          </div>
          <div>
            <label className="text-sm text-navy-400 block mb-1">Gebührenart</label>
            <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm">
              <option value="beratung">Erstberatung (§ 34 RVG)</option>
              <option value="aussergerichtlich">Außergerichtlich (VV 2300)</option>
              <option value="gericht">Gerichtlich (VV 3100)</option>
            </select>
          </div>
        </div>
        <Button variant="primary" onClick={calc} disabled={!wert}>Berechnen</Button>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-4">Gebührenberechnung</h3>
          <p className="text-sm text-navy-400 mb-3">Gegenstandswert: {result.gegenstandswert.toLocaleString('de-DE')} € · Einfache Gebühr: {result.einfacheGebuehr.toFixed(2)} €</p>
          <div className="space-y-2 mb-4">
            {result.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-navy-50 rounded-xl">
                <div><span className="text-sm font-medium text-navy-800">{item.label}</span><span className="text-xs text-navy-400 ml-2">({item.vvNr}, {item.factor}x)</span></div>
                <span className="font-bold text-navy-800">{item.amount.toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between p-3 bg-navy-50 rounded-xl">
              <span className="text-sm text-navy-600">Auslagenpauschale (VV 7002)</span>
              <span className="font-bold text-navy-800">{result.auslagenpauschale.toFixed(2)} €</span>
            </div>
          </div>
          <div className="border-t border-navy-200 pt-3 space-y-1">
            <div className="flex justify-between"><span className="text-navy-500">Netto</span><span className="font-bold">{result.netto.toFixed(2)} €</span></div>
            <div className="flex justify-between"><span className="text-navy-500">19% MwSt.</span><span>{result.mwst.toFixed(2)} €</span></div>
            <div className="flex justify-between text-lg"><span className="font-bold text-navy-900">Brutto</span><span className="font-bold text-gold-600">{result.brutto.toFixed(2)} €</span></div>
          </div>
        </Card>
      )}
    </div>
  )
}
