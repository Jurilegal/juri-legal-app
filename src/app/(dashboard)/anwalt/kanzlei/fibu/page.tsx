'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface FibuEntry { id:string; case_id:string|null; entry_type:string; amount:number; description:string|null; booking_date:string; account_number:string|null; tax_rate:number; created_at:string; case_title?:string }

const ENTRY_TYPES:{[k:string]:{label:string;variant:'success'|'error'|'warning'|'neutral'}} = {
  einnahme:{label:'Einnahme',variant:'success'}, ausgabe:{label:'Ausgabe',variant:'error'},
  fremdgeld:{label:'Fremdgeld',variant:'warning'}, vorschuss:{label:'Vorschuss',variant:'neutral'}
}

export default function FibuPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<FibuEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ entry_type:'einnahme', amount:'', description:'', booking_date:new Date().toISOString().split('T')[0], account_number:'', tax_rate:'19', case_id:'' })
  const [saving, setSaving] = useState(false)
  const [cases, setCases] = useState<{id:string;title:string;reference_number:string|null}[]>([])
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0,7))

  useEffect(()=>{load()},[filterMonth]) // eslint-disable-line
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const startDate = `${filterMonth}-01`
    const endMonth = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth()+1))
    const endDate = endMonth.toISOString().split('T')[0]
    const { data } = await supabase.from('fibu_entries').select('*').eq('user_id',user.id).gte('booking_date',startDate).lt('booking_date',endDate).order('booking_date',{ascending:false})
    // Enrich with case titles
    const { data:c } = await supabase.from('cases').select('id,title,reference_number').eq('user_id',user.id)
    setCases((c||[]) as typeof cases)
    const enriched = (data||[]).map(e=>({...e,case_title:(c||[]).find(ca=>ca.id===e.case_id)?.title})) as FibuEntry[]
    setEntries(enriched)
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('fibu_entries').insert({
      user_id:user.id, entry_type:form.entry_type, amount:parseFloat(form.amount)||0,
      description:form.description||null, booking_date:form.booking_date,
      account_number:form.account_number||null, tax_rate:parseFloat(form.tax_rate)||19,
      case_id:form.case_id||null
    })
    setForm({entry_type:'einnahme',amount:'',description:'',booking_date:new Date().toISOString().split('T')[0],account_number:'',tax_rate:'19',case_id:''})
    setShowForm(false); setSaving(false); load()
  }

  async function deleteEntry(id:string) {
    if(!confirm('Buchung wirklich löschen?')) return
    await supabase.from('fibu_entries').delete().eq('id',id)
    load()
  }

  const filtered = filterType==='all'?entries:entries.filter(e=>e.entry_type===filterType)
  const totalEinnahmen = entries.filter(e=>e.entry_type==='einnahme').reduce((s,e)=>s+e.amount,0)
  const totalAusgaben = entries.filter(e=>e.entry_type==='ausgabe').reduce((s,e)=>s+e.amount,0)
  const totalFremdgeld = entries.filter(e=>e.entry_type==='fremdgeld').reduce((s,e)=>s+e.amount,0)
  const totalVorschuss = entries.filter(e=>e.entry_type==='vorschuss').reduce((s,e)=>s+e.amount,0)
  const saldo = totalEinnahmen - totalAusgaben

  const exportCSV = () => {
    const header = 'Datum;Typ;Betrag;MwSt;Konto;Beschreibung;Akte\n'
    const rows = filtered.map(e=>`${e.booking_date};${ENTRY_TYPES[e.entry_type]?.label||e.entry_type};${e.amount.toFixed(2)};${e.tax_rate}%;${e.account_number||''};${e.description||''};${e.case_title||''}`).join('\n')
    const blob = new Blob([header+rows], {type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download=`fibu-${filterMonth}.csv`; a.click()
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-navy-800">Finanzbuchhaltung</h2><p className="text-sm text-navy-400">Aktenbuchhaltung & Einnahmen/Ausgaben</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportCSV}>📥 CSV-Export</Button>
          <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>{showForm?'Abbrechen':'+ Buchung'}</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4"><p className="text-xs text-navy-400">Einnahmen</p><p className="text-xl font-bold text-green-600">{totalEinnahmen.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Ausgaben</p><p className="text-xl font-bold text-red-600">{totalAusgaben.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Saldo</p><p className={`text-xl font-bold ${saldo>=0?'text-green-600':'text-red-600'}`}>{saldo.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Fremdgeld</p><p className="text-xl font-bold text-amber-600">{totalFremdgeld.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Vorschüsse</p><p className="text-xl font-bold text-navy-600">{totalVorschuss.toFixed(2)} €</p></Card>
      </div>

      {showForm && (
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-navy-800">Neue Buchung</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-sm font-medium text-navy-700 mb-1">Typ</label>
              <select value={form.entry_type} onChange={e=>setForm({...form,entry_type:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm">
                {Object.entries(ENTRY_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <Input label="Betrag (€)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/>
            <Input label="Datum" type="date" value={form.booking_date} onChange={e=>setForm({...form,booking_date:e.target.value})}/>
            <Input label="MwSt (%)" type="number" value={form.tax_rate} onChange={e=>setForm({...form,tax_rate:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kontonummer" value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value})} placeholder="z.B. 8400"/>
            <div><label className="block text-sm font-medium text-navy-700 mb-1">Akte zuordnen</label>
              <select value={form.case_id} onChange={e=>setForm({...form,case_id:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm">
                <option value="">— Keine Akte —</option>
                {cases.map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
              </select>
            </div>
          </div>
          <Input label="Beschreibung" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Buchungstext"/>
          <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.amount}>Buchen</Button>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="px-3 py-2 rounded-xl border border-navy-200 text-sm"/>
        {['all',...Object.keys(ENTRY_TYPES)].map(t=>(
          <button key={t} onClick={()=>setFilterType(t)} className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${filterType===t?'bg-navy-800 text-white':'bg-white text-navy-600 border border-navy-200'}`}>
            {t==='all'?'Alle':ENTRY_TYPES[t]?.label||t}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-navy-100">
            <th className="text-left p-3 text-navy-500 font-medium">Datum</th>
            <th className="text-left p-3 text-navy-500 font-medium">Typ</th>
            <th className="text-left p-3 text-navy-500 font-medium">Beschreibung</th>
            <th className="text-left p-3 text-navy-500 font-medium">Akte</th>
            <th className="text-right p-3 text-navy-500 font-medium">Betrag</th>
            <th className="text-right p-3 text-navy-500 font-medium">MwSt</th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {filtered.length===0?<tr><td colSpan={7} className="p-8 text-center text-navy-400">Keine Buchungen im Zeitraum.</td></tr>:
            filtered.map(e=>(
              <tr key={e.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                <td className="p-3 text-navy-600">{new Date(e.booking_date).toLocaleDateString('de-DE')}</td>
                <td className="p-3"><Badge variant={ENTRY_TYPES[e.entry_type]?.variant||'neutral'}>{ENTRY_TYPES[e.entry_type]?.label||e.entry_type}</Badge></td>
                <td className="p-3 text-navy-700">{e.description||'—'}</td>
                <td className="p-3 text-navy-500 text-xs">{e.case_title||'—'}</td>
                <td className={`p-3 text-right font-medium ${e.entry_type==='einnahme'?'text-green-600':'text-navy-800'}`}>{e.amount.toFixed(2)} €</td>
                <td className="p-3 text-right text-navy-500">{e.tax_rate}%</td>
                <td className="p-3"><button onClick={()=>deleteEntry(e.id)} className="text-red-400 hover:text-red-600 cursor-pointer text-xs">🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
