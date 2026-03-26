'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface KBEntry { id:string; title:string; category:string; content:string|null; tags:string[]; created_at:string }

const categories = ['Vorlage','Checkliste','Muster','Rechtsprechung','Notiz','Leitfaden']

export default function WissenPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<KBEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KBEntry|null>(null)
  const [form, setForm] = useState({ title:'', category:'Notiz', content:'', tags:'' })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<KBEntry|null>(null)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('knowledge_base').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setEntries((data||[]) as KBEntry[]); setLoading(false)
  }
  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const payload = { title:form.title, category:form.category, content:form.content, tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean) }
    if(editing) await supabase.from('knowledge_base').update(payload).eq('id',editing.id)
    else await supabase.from('knowledge_base').insert({...payload, user_id:user.id})
    reset(); setSaving(false); load()
  }
  function reset() { setForm({title:'',category:'Notiz',content:'',tags:''}); setEditing(null); setShowForm(false) }
  function edit(e:KBEntry) { setForm({title:e.title,category:e.category,content:e.content||'',tags:(e.tags||[]).join(', ')}); setEditing(e); setShowForm(true) }
  async function del(id:string) { if(!confirm('Eintrag löschen?')) return; await supabase.from('knowledge_base').delete().eq('id',id); load() }

  const filtered = entries.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content?.toLowerCase().includes(search.toLowerCase()) || e.tags?.some(t=>t.toLowerCase().includes(search.toLowerCase())))

  if(selected) return (
    <div className="space-y-4 max-w-3xl">
      <button onClick={()=>setSelected(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück</button>
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-3"><span className="text-xs bg-navy-100 text-navy-600 px-2 py-1 rounded">{selected.category}</span>
          {selected.tags?.map(t=><span key={t} className="text-xs bg-gold-50 text-gold-700 px-2 py-1 rounded">#{t}</span>)}
        </div>
        <h2 className="text-xl font-bold text-navy-800 mb-4">{selected.title}</h2>
        <div className="text-navy-600 whitespace-pre-wrap leading-relaxed">{selected.content}</div>
      </Card>
    </div>
  )

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-navy-800">Wissensmanagement</h2>
        <div className="flex gap-2">
          <Input placeholder="Suchen..." value={search} onChange={e=>setSearch(e.target.value)} className="w-48"/>
          <Button variant="primary" size="sm" onClick={()=>{reset();setShowForm(!showForm)}}>{showForm?'Abbrechen':'+ Eintrag'}</Button>
        </div>
      </div>
      {showForm && (
        <Card className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Titel *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Kategorie</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                {categories.map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={8} placeholder="Inhalt..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"/>
          <Input label="Tags (kommagetrennt)" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="z.B. Arbeitsrecht, Kündigung, Muster"/>
          <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.title.trim()}>{editing?'Speichern':'Anlegen'}</Button>
        </Card>
      )}
      {filtered.length===0?<Card className="p-8 text-center"><span className="text-4xl block mb-3">📚</span><p className="text-navy-400">Noch keine Einträge.</p></Card>:(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{filtered.map(e=>(
          <Card key={e.id} className="p-5" onClick={()=>setSelected(e)}>
            <div className="flex items-center gap-2 mb-1"><span className="text-xs bg-navy-100 text-navy-600 px-2 py-0.5 rounded">{e.category}</span></div>
            <h3 className="font-semibold text-navy-800">{e.title}</h3>
            <p className="text-xs text-navy-400 line-clamp-2 mt-1">{e.content?.substring(0,100)}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1">{e.tags?.slice(0,3).map(t=><span key={t} className="text-[10px] bg-gold-50 text-gold-600 px-1.5 py-0.5 rounded">#{t}</span>)}</div>
              <div className="flex gap-2">
                <button onClick={ev=>{ev.stopPropagation();edit(e)}} className="text-xs text-navy-400 cursor-pointer">✏️</button>
                <button onClick={ev=>{ev.stopPropagation();del(e.id)}} className="text-xs text-red-400 cursor-pointer">🗑️</button>
              </div>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
