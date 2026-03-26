'use client'
import { useState } from 'react'
import { calculateRVG, type RVGType, type RVGCalculation } from '@/lib/rvg'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const TYPES:{value:RVGType;label:string}[] = [
  {value:'beratung',label:'Erstberatung (§ 34 RVG)'},
  {value:'aussergerichtlich',label:'Außergerichtliche Vertretung'},
  {value:'gericht',label:'Gerichtliches Verfahren 1. Instanz'},
  {value:'berufung',label:'Berufungsverfahren'},
  {value:'pkh',label:'PKH-Verfahren'},
  {value:'mahnverfahren',label:'Mahnverfahren'},
]

export default function RVGPage() {
  const [wert, setWert] = useState('5000')
  const [type, setType] = useState<RVGType>('aussergerichtlich')
  const [anzahlAuftraggeber, setAnzahl] = useState('1')
  const [mitEinigung, setMitEinigung] = useState(true)
  const [mitGK, setMitGK] = useState(true)
  const [obsiegensquote, setObsiegensquote] = useState('100')
  const [result, setResult] = useState<RVGCalculation|null>(null)

  function calc() {
    const val = parseFloat(wert) || 0
    if(val<=0) return
    const r = calculateRVG(val, type, {
      anzahlAuftraggeber: parseInt(anzahlAuftraggeber)||1,
      mitEinigung, mitGerichtskosten:mitGK,
      obsiegensquote: parseInt(obsiegensquote)||100
    })
    setResult(r)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">RVG-Gebührenrechner</h2>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Gegenstandswert (€) *" type="number" value={wert} onChange={e=>setWert(e.target.value)} placeholder="z.B. 5000"/>
          <div><label className="text-sm text-navy-400 block mb-1">Verfahrensart</label>
            <select value={type} onChange={e=>setType(e.target.value as RVGType)} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <Input label="Anzahl Auftraggeber" type="number" value={anzahlAuftraggeber} onChange={e=>setAnzahl(e.target.value)} min={1}/>
          {(type==='gericht'||type==='berufung') && (
            <Input label="Obsiegensquote (%)" type="number" value={obsiegensquote} onChange={e=>setObsiegensquote(e.target.value)} min={0} max={100}/>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-navy-600"><input type="checkbox" checked={mitEinigung} onChange={e=>setMitEinigung(e.target.checked)}/> Mit Einigungsgebühr</label>
          {(type==='gericht'||type==='berufung') && <label className="flex items-center gap-2 text-sm text-navy-600"><input type="checkbox" checked={mitGK} onChange={e=>setMitGK(e.target.checked)}/> Mit Gerichtskosten (GKG)</label>}
        </div>
        <Button variant="primary" onClick={calc}>⚖️ Berechnen</Button>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-4">Kostenberechnung</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-navy-200"><th className="text-left py-2 text-navy-500">Position</th><th className="text-left py-2 text-navy-500">VV-Nr.</th><th className="text-right py-2 text-navy-500">Faktor</th><th className="text-right py-2 text-navy-500">Betrag</th></tr></thead>
            <tbody>
              <tr className="text-xs text-navy-400"><td colSpan={4}>Gegenstandswert: {result.gegenstandswert.toLocaleString('de-DE')} € · Einfache Gebühr: {result.einfacheGebuehr.toFixed(2)} €</td></tr>
              {result.items.map((item,i)=>(
                <tr key={i} className="border-b border-navy-50">
                  <td className="py-2 text-navy-700">{item.label}</td>
                  <td className="py-2 text-navy-500 text-xs">{item.vvNr}</td>
                  <td className="py-2 text-right text-navy-500">{item.factor.toFixed(1)}</td>
                  <td className="py-2 text-right font-medium text-navy-800">{item.amount.toFixed(2)} €</td>
                </tr>
              ))}
              {result.erhoehungsgebuehr > 0 && (
                <tr className="border-b border-navy-50">
                  <td className="py-2 text-navy-700">Erhöhungsgebühr ({parseInt(anzahlAuftraggeber)-1} weitere Auftraggeber)</td>
                  <td className="py-2 text-navy-500 text-xs">Nr. 1008 VV RVG</td>
                  <td className="py-2 text-right text-navy-500">×0.3</td>
                  <td className="py-2 text-right font-medium text-navy-800">{result.erhoehungsgebuehr.toFixed(2)} €</td>
                </tr>
              )}
              <tr className="border-b border-navy-100">
                <td className="py-2 text-navy-500" colSpan={3}>Zwischensumme</td>
                <td className="py-2 text-right text-navy-600">{result.zwischensumme.toFixed(2)} €</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-700">Auslagenpauschale</td>
                <td className="py-2 text-navy-500 text-xs">Nr. 7002 VV RVG</td>
                <td className="py-2 text-right text-navy-500">max 20€</td>
                <td className="py-2 text-right font-medium text-navy-800">{result.auslagenpauschale.toFixed(2)} €</td>
              </tr>
              <tr className="border-b border-navy-100">
                <td className="py-2 font-medium" colSpan={3}>Nettobetrag</td>
                <td className="py-2 text-right font-medium">{result.netto.toFixed(2)} €</td>
              </tr>
              <tr className="border-b border-navy-100">
                <td className="py-2 text-navy-500" colSpan={2}>19% MwSt.</td>
                <td className="py-2 text-navy-500 text-xs text-right">Nr. 7008 VV RVG</td>
                <td className="py-2 text-right text-navy-600">{result.mwst.toFixed(2)} €</td>
              </tr>
              <tr className="border-t-2 border-navy-800">
                <td className="py-3 font-bold text-navy-800 text-base" colSpan={3}>Gesamtbetrag (brutto)</td>
                <td className="py-3 text-right font-bold text-gold-600 text-lg">{result.brutto.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          {result.gerichtskosten && (
            <div className="mt-4 pt-4 border-t border-navy-100">
              <h4 className="font-semibold text-navy-800 mb-2">Gerichtskosten (GKG)</h4>
              <div className="flex justify-between text-sm"><span className="text-navy-600">3-fache Gebühr (Klageverfahren)</span><span className="font-medium">{result.gerichtskosten.toFixed(2)} €</span></div>
            </div>
          )}

          {result.kostenausgleich && (
            <div className="mt-4 pt-4 border-t border-navy-100">
              <h4 className="font-semibold text-navy-800 mb-2">Kostenausgleichung (§ 92 ZPO)</h4>
              <p className="text-xs text-navy-400 mb-2">Quote: {result.kostenausgleich.quote}% Obsiegen</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-600">Gegner zahlt</p><p className="font-bold text-emerald-700">{result.kostenausgleich.gegneranteil.toFixed(2)} €</p></div>
                <div className="p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-600">Eigenanteil</p><p className="font-bold text-red-700">{result.kostenausgleich.eigenanteil.toFixed(2)} €</p></div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={()=>{const text=`RVG-Berechnung\nGegenstandswert: ${result.gegenstandswert}€\n${result.items.map(i=>`${i.label} (${i.vvNr}): ${i.amount.toFixed(2)}€`).join('\n')}\nAuslagenpauschale: ${result.auslagenpauschale.toFixed(2)}€\nNetto: ${result.netto.toFixed(2)}€\nMwSt: ${result.mwst.toFixed(2)}€\nBrutto: ${result.brutto.toFixed(2)}€`;navigator.clipboard.writeText(text)}} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800">📋 Kopieren</button>
            <button onClick={()=>{const blob=new Blob([`RVG-Kostenberechnung\n${'='.repeat(40)}\nGegenstandswert: ${result.gegenstandswert.toLocaleString('de-DE')} €\n\n${result.items.map(i=>`${i.label}\n  ${i.vvNr} · Faktor ${i.factor} · ${i.amount.toFixed(2)} €`).join('\n\n')}\n\n${result.erhoehungsgebuehr>0?`Erhöhungsgebühr (Nr. 1008): ${result.erhoehungsgebuehr.toFixed(2)} €\n`:''}\nZwischensumme: ${result.zwischensumme.toFixed(2)} €\nAuslagenpauschale (Nr. 7002): ${result.auslagenpauschale.toFixed(2)} €\nNettobetrag: ${result.netto.toFixed(2)} €\n19% MwSt (Nr. 7008): ${result.mwst.toFixed(2)} €\n${'='.repeat(40)}\nGESAMTBETRAG: ${result.brutto.toFixed(2)} €${result.gerichtskosten?`\n\nGerichtskosten (GKG): ${result.gerichtskosten.toFixed(2)} €`:''}`],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RVG-Berechnung.txt';a.click()}} className="text-xs text-navy-500 cursor-pointer hover:text-navy-700">📥 Als Datei</button>
          </div>
        </Card>
      )}
    </div>
  )
}
