'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Resubmission { id:string; title:string; description:string|null; due_date:string; case_id:string|null; case_title?:string; priority:string; status:string; created_at:string }

export default function WiedervorlagenPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Resubmission[]>([])
  const [cases, setCases] = useState<{id:string;title:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', due_date:'', case_id:'', priority:'normal' })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'pending'|'done'>('pending')

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    // We store resubmissions in deadlines with a special type
    const { data:deadlines } = await supabase.from('deadlines').select('*').eq('user_id',user.id).eq('type','wiedervorlage').order('due_date')
    const { data:casesData } = await supabase.from('cases').select('id,title').eq('user_id',user.id)
    setCases((casesData||[]) as {id:string;title:string}[])
    const mapped = (deadlines||[]).map((d: Record<string,unknown>)=>({
      id:d.id as string, title:d.title as string, description:d.description as string|null,
      due_date:d.due_date as string, case_id:d.case_id as string|null,
      case_title:(casesData||[]).find((c:{id:string})=>c.id===d.case_id)?.title,
      priority:d.priority as string||'normal', status:d.status as string||'pending',
      created_at:d.created_at as string
    }))
    setItems(mapped); setLoading(false)
  }
  async function create() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('deadlines').insert({
      user_id:user.id, title:form.title, description:form.description||null,
      due_date:form.due_date, case_id:form.case_id||null, priority:form.priority,
      type:'wiedervorlage', status:'pending'
    })
    setForm({title:'',description:'',due_date:'',case_id:'',priority:'normal'}); setShowForm(false); setSaving(false); load()
  }
  async function markDone(id:string) {
    await supabase.from('deadlines').update({status:'done'}).eq('id',id); load()
  }
  async function reopen(id:string) {
    await supabase.from('deadlines').update({status:'pending'}).eq('id',id); load()
  }

  const filtered = items.filter(i => tab==='pending' ? i.status==='pending' : i.status==='done')
  const today = new Date().toISOString().split('T')[0]
  const overdue = items.filter(i=>i.status==='pending'&&i.due_date<today).length
  const dueToday = items.filter(i=>i.status==='pending'&&i.due_date===today).length

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Wiedervorlagen</h2>
        <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>{showForm?'Abbrechen':'+ Neue Wiedervorlage'}</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Offen</p><p className="text-2xl font-bold text-navy-900">{items.filter(i=>i.status==='pending').length}</p></Card>
        <Card className={`p-4 ${overdue>0?'border-red-200':''}`}><p className="text-xs text-navy-400">Überfällig</p><p className={`text-2xl font-bold ${overdue>0?'text-red-600':'text-navy-900'}`}>{overdue}</p></Card>
        <Card className={`p-4 ${dueToday>0?'border-amber-200':''}`}><p className="text-xs text-navy-400">Heute fällig</p><p className="text-2xl font-bold text-amber-600">{dueToday}</p></Card>
      </div>

      {showForm && (
        <Card className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Betreff *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            <Input label="Datum *" type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Akte (optional)</label>
              <select value={form.case_id} onChange={e=>setForm(f=>({...f,case_id:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                <option value="">Keine Zuordnung</option>
                {cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
              </select></div>
            <div><label className="text-sm text-navy-400 block mb-1">Priorität</label>
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                <option value="low">Niedrig</option><option value="normal">Normal</option><option value="high">Hoch</option><option value="urgent">Dringend</option>
              </select></div>
          </div>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Notizen..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"/>
          <Button variant="primary" size="sm" onClick={create} loading={saving} disabled={!form.title||!form.due_date}>Anlegen</Button>
        </Card>
      )}

      <div className="flex gap-2">
        <button onClick={()=>setTab('pending')} className={`px-4 py-2 rounded-xl text-sm cursor-pointer ${tab==='pending'?'bg-navy-800 text-white':'bg-navy-50 text-navy-600'}`}>Offen ({items.filter(i=>i.status==='pending').length})</button>
        <button onClick={()=>setTab('done')} className={`px-4 py-2 rounded-xl text-sm cursor-pointer ${tab==='done'?'bg-navy-800 text-white':'bg-navy-50 text-navy-600'}`}>Erledigt ({items.filter(i=>i.status==='done').length})</button>
      </div>

      {filtered.length===0?<Card className="p-8 text-center"><p className="text-navy-400">{tab==='pending'?'Keine offenen Wiedervorlagen.':'Keine erledigten Wiedervorlagen.'}</p></Card>:(
        <div className="space-y-2">{filtered.map(item=>{
          const isOverdue = item.status==='pending' && item.due_date<today
          const isToday = item.due_date===today
          const prioColors:Record<string,string> = {low:'bg-gray-100 text-gray-600',normal:'bg-blue-50 text-blue-600',high:'bg-amber-50 text-amber-700',urgent:'bg-red-50 text-red-700'}
          return(
            <Card key={item.id} className={`p-4 ${isOverdue?'border-red-200 bg-red-50/30':isToday?'border-amber-200 bg-amber-50/30':''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.status==='pending' ? (
                    <button onClick={()=>markDone(item.id)} className="w-6 h-6 rounded-full border-2 border-navy-300 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"/>
                  ) : (
                    <button onClick={()=>reopen(item.id)} className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs cursor-pointer">✓</button>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${item.status==='done'?'line-through text-navy-400':'text-navy-800'}`}>{item.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${prioColors[item.priority]||prioColors.normal}`}>{item.priority}</span>
                      {isOverdue && <Badge variant="error">Überfällig</Badge>}
                      {isToday && !isOverdue && <Badge variant="warning">Heute</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-navy-400">{new Date(item.due_date).toLocaleDateString('de-DE')}</span>
                      {item.case_title && <span className="text-xs text-navy-400">· Akte: {item.case_title}</span>}
                    </div>
                  </div>
                </div>
              </div>
              {item.description && <p className="text-xs text-navy-500 mt-2 ml-9">{item.description}</p>}
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
