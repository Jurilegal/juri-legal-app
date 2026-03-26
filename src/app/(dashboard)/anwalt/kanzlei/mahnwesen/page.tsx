'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Dunning { id:string; debtor_name:string; debtor_address:string|null; original_amount:number; interest_rate:number; current_stage:string; due_date:string; status:string; stage_history:Array<{stage:string;date:string;note?:string}>; notes:string|null; created_at:string }

const stageLabels:Record<string,{label:string;variant:'neutral'|'warning'|'error'|'success'}> = {
  mahnung_1:{label:'1. Mahnung',variant:'warning'}, mahnung_2:{label:'2. Mahnung',variant:'warning'},
  mahnung_3:{label:'3. Mahnung',variant:'error'}, mahnbescheid:{label:'Mahnbescheid',variant:'error'},
  vollstreckung:{label:'Vollstreckung',variant:'error'},
}
const stageOrder = ['mahnung_1','mahnung_2','mahnung_3','mahnbescheid','vollstreckung']

export default function MahnwesenPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Dunning[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ debtor_name:'', debtor_address:'', original_amount:'', interest_rate:'5', due_date:'' })
  const [saving, setSaving] = useState(false)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('dunning_processes').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setItems((data||[]) as Dunning[]); setLoading(false)
  }
  async function create() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('dunning_processes').insert({
      user_id:user.id, debtor_name:form.debtor_name, debtor_address:form.debtor_address,
      original_amount:parseFloat(form.original_amount), interest_rate:parseFloat(form.interest_rate),
      due_date:form.due_date, stage_history:[{stage:'mahnung_1',date:new Date().toISOString().split('T')[0]}]
    })
    setForm({debtor_name:'',debtor_address:'',original_amount:'',interest_rate:'5',due_date:''}); setShowForm(false); setSaving(false); load()
  }
  async function escalate(d:Dunning) {
    const idx = stageOrder.indexOf(d.current_stage)
    if(idx >= stageOrder.length-1) return
    const next = stageOrder[idx+1]
    const history = [...d.stage_history, {stage:next, date:new Date().toISOString().split('T')[0]}]
    await supabase.from('dunning_processes').update({current_stage:next, stage_history:history}).eq('id',d.id)
    load()
  }
  async function markPaid(id:string) {
    await supabase.from('dunning_processes').update({status:'paid'}).eq('id',id); load()
  }

  const calcInterest = (d:Dunning) => {
    const days = Math.max(0, Math.floor((Date.now()-new Date(d.due_date).getTime())/(86400000)))
    return Math.round(d.original_amount * (d.interest_rate/100) * (days/365) * 100)/100
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Mahnwesen</h2>
        <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>{showForm?'Abbrechen':'+ Neuer Mahnvorgang'}</Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Aktive Verfahren</p><p className="text-2xl font-bold text-navy-900">{items.filter(i=>i.status==='active').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Offene Forderungen</p><p className="text-2xl font-bold text-red-600">{items.filter(i=>i.status==='active').reduce((s,i)=>s+i.original_amount,0).toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Bezahlt</p><p className="text-2xl font-bold text-emerald-600">{items.filter(i=>i.status==='paid').reduce((s,i)=>s+i.original_amount,0).toFixed(2)} €</p></Card>
      </div>
      {showForm && (
        <Card className="p-6"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Input label="Schuldner *" value={form.debtor_name} onChange={e=>setForm(f=>({...f,debtor_name:e.target.value}))}/>
          <Input label="Adresse" value={form.debtor_address} onChange={e=>setForm(f=>({...f,debtor_address:e.target.value}))}/>
          <Input label="Forderungsbetrag (€) *" type="number" value={form.original_amount} onChange={e=>setForm(f=>({...f,original_amount:e.target.value}))}/>
          <Input label="Zinssatz (%)" type="number" value={form.interest_rate} onChange={e=>setForm(f=>({...f,interest_rate:e.target.value}))}/>
          <Input label="Fälligkeitsdatum *" type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/>
        </div><Button variant="primary" size="sm" onClick={create} loading={saving} disabled={!form.debtor_name||!form.original_amount||!form.due_date}>Mahnvorgang starten</Button></Card>
      )}
      {items.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Keine Mahnvorgänge.</p></Card>:(
        <div className="space-y-3">{items.map(d=>{
          const st = stageLabels[d.current_stage]||stageLabels.mahnung_1
          const interest = calcInterest(d)
          const isPaid = d.status==='paid'
          return(
            <Card key={d.id} className={`p-5 ${isPaid?'opacity-60':''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold text-navy-800">{d.debtor_name}</span><Badge variant={isPaid?'success':st.variant}>{isPaid?'Bezahlt':st.label}</Badge></div>
                  <p className="text-xs text-navy-400 mt-0.5">Fällig: {new Date(d.due_date).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy-900">{d.original_amount.toFixed(2)} €</p>
                  {!isPaid && interest>0 && <p className="text-xs text-red-500">+ {interest.toFixed(2)} € Zinsen</p>}
                </div>
              </div>
              {/* Stage progress */}
              <div className="flex gap-1 mb-3">{stageOrder.map((s,i)=>(
                <div key={s} className={`flex-1 h-2 rounded-full ${stageOrder.indexOf(d.current_stage)>=i?'bg-gold-400':'bg-navy-100'}`}/>
              ))}</div>
              {!isPaid && (
                <div className="flex gap-2">
                  {stageOrder.indexOf(d.current_stage)<stageOrder.length-1 && <button onClick={()=>escalate(d)} className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">⬆️ Eskalieren</button>}
                  <button onClick={()=>markPaid(d.id)} className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-800">✅ Als bezahlt markieren</button>
                </div>
              )}
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
