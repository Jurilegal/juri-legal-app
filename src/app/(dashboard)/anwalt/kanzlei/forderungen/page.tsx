'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Claim { id:string; debtor_name:string; creditor_name:string; amount:number; currency:string; due_date:string; status:string; claim_type:string; interest_rate:number; notes:string|null; created_at:string }

const statusLabels:Record<string,{label:string;variant:'neutral'|'warning'|'error'|'success'}> = {
  open:{label:'Offen',variant:'warning'}, partial:{label:'Teilweise bezahlt',variant:'neutral'},
  paid:{label:'Bezahlt',variant:'success'}, disputed:{label:'Bestritten',variant:'error'},
  enforcing:{label:'Vollstreckung',variant:'error'}, written_off:{label:'Abgeschrieben',variant:'neutral'},
}
const claimTypes = ['Honorar','Schadensersatz','Kaufpreis','Miete','Darlehen','Werklohn','Sonstige']

export default function ForderungenPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ debtor_name:'', creditor_name:'', amount:'', due_date:'', claim_type:'Honorar', interest_rate:'5', notes:'' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('claims').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setClaims((data||[]) as Claim[]); setLoading(false)
  }
  async function create() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('claims').insert({
      user_id:user.id, debtor_name:form.debtor_name, creditor_name:form.creditor_name||null,
      amount:parseFloat(form.amount), due_date:form.due_date, claim_type:form.claim_type,
      interest_rate:parseFloat(form.interest_rate), notes:form.notes||null
    })
    setForm({debtor_name:'',creditor_name:'',amount:'',due_date:'',claim_type:'Honorar',interest_rate:'5',notes:''}); setShowForm(false); setSaving(false); load()
  }
  async function updateStatus(id:string, status:string) {
    await supabase.from('claims').update({status}).eq('id',id); load()
  }

  const filtered = claims.filter(c => filter==='all' || c.status===filter)
  const totalOpen = claims.filter(c=>c.status==='open'||c.status==='partial'||c.status==='enforcing').reduce((s,c)=>s+c.amount,0)
  const totalPaid = claims.filter(c=>c.status==='paid').reduce((s,c)=>s+c.amount,0)

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Forderungsmanagement</h2>
        <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>{showForm?'Abbrechen':'+ Neue Forderung'}</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Offene Forderungen</p><p className="text-2xl font-bold text-red-600">{totalOpen.toFixed(2)} €</p><p className="text-xs text-navy-400">{claims.filter(c=>['open','partial','enforcing'].includes(c.status)).length} Vorgänge</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Bezahlt (gesamt)</p><p className="text-2xl font-bold text-emerald-600">{totalPaid.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Erfolgsquote</p><p className="text-2xl font-bold text-navy-900">{claims.length?Math.round(claims.filter(c=>c.status==='paid').length/claims.length*100):0}%</p></Card>
      </div>

      {showForm && (
        <Card className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Schuldner *" value={form.debtor_name} onChange={e=>setForm(f=>({...f,debtor_name:e.target.value}))}/>
            <Input label="Gläubiger (Mandant)" value={form.creditor_name} onChange={e=>setForm(f=>({...f,creditor_name:e.target.value}))}/>
            <Input label="Forderungsbetrag (€) *" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            <Input label="Fälligkeitsdatum *" type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Art der Forderung</label>
              <select value={form.claim_type} onChange={e=>setForm(f=>({...f,claim_type:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                {claimTypes.map(t=><option key={t}>{t}</option>)}
              </select></div>
            <Input label="Zinssatz (%)" type="number" value={form.interest_rate} onChange={e=>setForm(f=>({...f,interest_rate:e.target.value}))}/>
          </div>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder="Notizen..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"/>
          <Button variant="primary" size="sm" onClick={create} loading={saving} disabled={!form.debtor_name||!form.amount||!form.due_date}>Forderung anlegen</Button>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all','open','partial','paid','disputed','enforcing','written_off'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors ${filter===f?'bg-navy-800 text-white':'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>
            {f==='all'?'Alle':(statusLabels[f]?.label||f)} {f==='all'?`(${claims.length})`:`(${claims.filter(c=>c.status===f).length})`}
          </button>
        ))}
      </div>

      {filtered.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Keine Forderungen.</p></Card>:(
        <div className="space-y-3">{filtered.map(c=>{
          const st = statusLabels[c.status]||statusLabels.open
          const overdue = new Date(c.due_date)<new Date() && c.status==='open'
          const days = Math.floor((Date.now()-new Date(c.due_date).getTime())/86400000)
          const interest = c.status!=='paid' && days>0 ? Math.round(c.amount*(c.interest_rate/100)*(days/365)*100)/100 : 0
          return(
            <Card key={c.id} className={`p-5 ${overdue?'border-red-200':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-navy-800">{c.debtor_name}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <span className="text-xs bg-navy-50 text-navy-500 px-2 py-0.5 rounded">{c.claim_type}</span>
                    {overdue && <span className="text-xs text-red-500 font-medium">⚠️ {days} Tage überfällig</span>}
                  </div>
                  {c.creditor_name && <p className="text-xs text-navy-400">Gläubiger: {c.creditor_name}</p>}
                  {c.notes && <p className="text-xs text-navy-500 mt-1">{c.notes}</p>}
                  <p className="text-xs text-navy-400 mt-1">Fällig: {new Date(c.due_date).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-navy-900">{c.amount.toFixed(2)} €</p>
                  {interest>0 && <p className="text-xs text-red-500">+ {interest.toFixed(2)} € Zinsen</p>}
                </div>
              </div>
              {c.status!=='paid' && c.status!=='written_off' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-navy-50">
                  <button onClick={()=>updateStatus(c.id,'paid')} className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-800">✅ Bezahlt</button>
                  <button onClick={()=>updateStatus(c.id,'partial')} className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">💰 Teilzahlung</button>
                  <button onClick={()=>updateStatus(c.id,'disputed')} className="text-xs text-red-500 cursor-pointer hover:text-red-700">❌ Bestritten</button>
                  <button onClick={()=>updateStatus(c.id,'enforcing')} className="text-xs text-navy-500 cursor-pointer hover:text-navy-700">⚖️ Vollstreckung</button>
                  <button onClick={()=>updateStatus(c.id,'written_off')} className="text-xs text-navy-400 cursor-pointer hover:text-navy-600">📝 Abschreiben</button>
                </div>
              )}
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
