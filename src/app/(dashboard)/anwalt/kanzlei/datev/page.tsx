'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ExportRow { umsatz:string; soll_haben:string; gegenkonto:string; belegdatum:string; buchungstext:string; konto:string }

export default function DATEVPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [exportType, setExportType] = useState<'buchungen'|'debitoren'|'sachkonten'>('buchungen')
  const [preview, setPreview] = useState<ExportRow[]>([])
  const [exported, setExported] = useState(false)
  const [stats, setStats] = useState({invoices:0,payments:0,fibu:0,total:0})

  async function generateExport() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const rows:ExportRow[] = []

    if(exportType==='buchungen') {
      // Rechnungen
      const { data:invoices } = await supabase.from('kanzlei_invoices').select('*').eq('user_id',user.id).gte('created_at',dateFrom).lte('created_at',dateTo+'T23:59:59')
      for(const inv of (invoices||[])) {
        rows.push({
          umsatz: (inv.total_amount||0).toFixed(2).replace('.',','),
          soll_haben: 'S',
          gegenkonto: '8400',
          belegdatum: new Date(inv.created_at).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\./g,''),
          buchungstext: `Rechnung ${inv.invoice_number||''}`,
          konto: '1400'
        })
      }
      // Zahlungseingänge
      const { data:payments } = await supabase.from('invoice_payments').select('*').eq('user_id',user.id).gte('payment_date',dateFrom).lte('payment_date',dateTo)
      for(const pay of (payments||[])) {
        rows.push({
          umsatz: pay.amount.toFixed(2).replace('.',','),
          soll_haben: 'H',
          gegenkonto: '1400',
          belegdatum: new Date(pay.payment_date).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\./g,''),
          buchungstext: `Zahlung ${pay.payment_method||''}`,
          konto: '1200'
        })
      }
      // FiBu Einträge
      const { data:fibu } = await supabase.from('fibu_entries').select('*').eq('user_id',user.id).gte('booking_date',dateFrom).lte('booking_date',dateTo)
      for(const entry of (fibu||[])) {
        rows.push({
          umsatz: entry.amount.toFixed(2).replace('.',','),
          soll_haben: entry.entry_type==='einnahme'?'S':'H',
          gegenkonto: entry.account_number||'9999',
          belegdatum: new Date(entry.booking_date).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\./g,''),
          buchungstext: entry.description||entry.entry_type,
          konto: entry.entry_type==='einnahme'?'8400':entry.entry_type==='ausgabe'?'4900':entry.entry_type==='fremdgeld'?'1590':'1500'
        })
      }
      setStats({invoices:(invoices||[]).length,payments:(payments||[]).length,fibu:(fibu||[]).length,total:rows.length})
    }

    setPreview(rows)
    setLoading(false)
  }

  function downloadCSV() {
    const header = '"Umsatz";"SollHaben";"Gegenkonto";"Belegdatum";"Buchungstext";"Konto"\n'
    const body = preview.map(r=>`"${r.umsatz}";"${r.soll_haben}";"${r.gegenkonto}";"${r.belegdatum}";"${r.buchungstext}";"${r.konto}"`).join('\n')
    const datevHeader = `"EXTF";700;21;"Buchungsstapel";12;${new Date().toISOString().split('T')[0].replace(/-/g,'')};;;;;;"RE";"";1;${dateFrom.replace(/-/g,'')};${dateTo.replace(/-/g,'')};;"";"";""\n`
    const blob = new Blob([datevHeader + header + body], {type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download=`DATEV-Export-${dateFrom}-bis-${dateTo}.csv`; a.click()
    setExported(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-navy-800">DATEV-Export</h2><p className="text-sm text-navy-400">Buchhaltungsdaten im DATEV-Format exportieren</p></div>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-navy-800">Export-Einstellungen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-navy-700 mb-1">Von</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm"/></div>
          <div><label className="block text-sm font-medium text-navy-700 mb-1">Bis</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm"/></div>
          <div><label className="block text-sm font-medium text-navy-700 mb-1">Export-Typ</label>
            <select value={exportType} onChange={e=>setExportType(e.target.value as typeof exportType)} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm">
              <option value="buchungen">Buchungsstapel</option>
              <option value="debitoren">Debitoren/Kreditoren</option>
              <option value="sachkonten">Sachkonten</option>
            </select></div>
        </div>
        <Button variant="primary" size="sm" onClick={generateExport} loading={loading}>📊 Export generieren</Button>
      </Card>

      {preview.length>0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4"><p className="text-xs text-navy-400">Rechnungen</p><p className="text-xl font-bold text-navy-900">{stats.invoices}</p></Card>
            <Card className="p-4"><p className="text-xs text-navy-400">Zahlungen</p><p className="text-xl font-bold text-green-600">{stats.payments}</p></Card>
            <Card className="p-4"><p className="text-xs text-navy-400">FiBu-Buchungen</p><p className="text-xl font-bold text-navy-900">{stats.fibu}</p></Card>
            <Card className="p-4"><p className="text-xs text-navy-400">Gesamt</p><p className="text-xl font-bold text-gold-600">{stats.total}</p></Card>
          </div>

          <Card className="overflow-x-auto">
            <div className="flex items-center justify-between p-4 border-b border-navy-100">
              <h3 className="font-semibold text-navy-800">Vorschau ({preview.length} Buchungen)</h3>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={downloadCSV}>📥 DATEV-CSV Download</Button>
                {exported && <Badge variant="success">✓ Exportiert</Badge>}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100">
                <th className="text-left p-3 text-navy-500 font-medium">Umsatz</th>
                <th className="text-left p-3 text-navy-500 font-medium">S/H</th>
                <th className="text-left p-3 text-navy-500 font-medium">Gegenkonto</th>
                <th className="text-left p-3 text-navy-500 font-medium">Belegdatum</th>
                <th className="text-left p-3 text-navy-500 font-medium">Buchungstext</th>
                <th className="text-left p-3 text-navy-500 font-medium">Konto</th>
              </tr></thead>
              <tbody>
                {preview.slice(0,50).map((r,i)=>(
                  <tr key={i} className="border-b border-navy-50 hover:bg-navy-50/50">
                    <td className="p-3 text-navy-800 font-medium">{r.umsatz} €</td>
                    <td className="p-3"><Badge variant={r.soll_haben==='S'?'success':'warning'}>{r.soll_haben==='S'?'Soll':'Haben'}</Badge></td>
                    <td className="p-3 text-navy-600 font-mono">{r.gegenkonto}</td>
                    <td className="p-3 text-navy-600">{r.belegdatum}</td>
                    <td className="p-3 text-navy-700">{r.buchungstext}</td>
                    <td className="p-3 text-navy-600 font-mono">{r.konto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length>50 && <p className="p-3 text-xs text-navy-400 text-center">... und {preview.length-50} weitere Buchungen</p>}
          </Card>
        </>
      )}

      {preview.length===0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-navy-500">Wählen Sie einen Zeitraum und klicken Sie &quot;Export generieren&quot;</p>
          <p className="text-xs text-navy-400 mt-2">Unterstützte Daten: Rechnungen, Zahlungseingänge, FiBu-Buchungen</p>
        </Card>
      )}
    </div>
  )
}
