'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Snippet { id:string; shortcut:string; title:string; content:string; category:string; created_at:string }

const categories = ['Anrede','Grußformel','Rechtsbelehrung','Standardtext','Klausel','Floskel','Sonstiges']

export default function TextbausteinePage() {
  const supabase = createClient()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Snippet|null>(null)
  const [form, setForm] = useState({ shortcut:'', title:'', content:'', category:'Standardtext' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string|null>(null)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('text_snippets').select('*').eq('user_id',user.id).order('shortcut')
    setSnippets((data||[]) as Snippet[]); setLoading(false)
  }
  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    if(editing) await supabase.from('text_snippets').update(form).eq('id',editing.id)
    else await supabase.from('text_snippets').insert({...form, user_id:user.id})
    setForm({shortcut:'',title:'',content:'',category:'Standardtext'}); setEditing(null); setShowForm(false); setSaving(false); load()
  }
  function copy(text:string, id:string) { navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(null),2000) }
  async function del(id:string) { if(!confirm('Löschen?')) return; await supabase.from('text_snippets').delete().eq('id',id); load() }

  const filtered = snippets.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.shortcut.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()))

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-800">Textbausteine</h2>
        <div className="flex gap-2">
          <Input placeholder="Suchen..." value={search} onChange={e=>setSearch(e.target.value)} className="w-48"/>
          <Button variant="primary" size="sm" onClick={()=>{setEditing(null);setForm({shortcut:'',title:'',content:'',category:'Standardtext'});setShowForm(!showForm)}}>{showForm?'Abbrechen':'+ Baustein'}</Button>
        </div>
      </div>

      <p className="text-sm text-navy-400">Häufig verwendete Textpassagen als Bausteine speichern und per Kürzel schnell einfügen.</p>

      {showForm && (
        <Card className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Kürzel * (z.B. /mfg)" value={form.shortcut} onChange={e=>setForm(f=>({...f,shortcut:e.target.value}))}/>
            <Input label="Titel *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Kategorie</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                {categories.map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={5} placeholder="Textbaustein eingeben..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y font-mono"/>
          <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.shortcut||!form.title||!form.content}>{editing?'Speichern':'Anlegen'}</Button>
        </Card>
      )}

      {filtered.length===0?<Card className="p-8 text-center"><span className="text-4xl block mb-3">📋</span><p className="text-navy-400">Noch keine Textbausteine. Legen Sie häufig verwendete Texte als Bausteine an.</p></Card>:(
        <div className="space-y-2">{filtered.map(s=>(
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="px-2 py-0.5 bg-gold-50 text-gold-700 rounded text-xs font-mono">{s.shortcut}</code>
                  <span className="font-medium text-navy-800 text-sm">{s.title}</span>
                  <span className="text-xs bg-navy-50 text-navy-400 px-2 py-0.5 rounded">{s.category}</span>
                </div>
                <p className="text-xs text-navy-500 line-clamp-2">{s.content}</p>
              </div>
              <div className="flex gap-2 ml-3">
                <button onClick={()=>copy(s.content,s.id)} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800">{copied===s.id?'✅':'📋'}</button>
                <button onClick={()=>{setEditing(s);setForm({shortcut:s.shortcut,title:s.title,content:s.content,category:s.category});setShowForm(true)}} className="text-xs text-navy-400 cursor-pointer">✏️</button>
                <button onClick={()=>del(s.id)} className="text-xs text-red-400 cursor-pointer">🗑️</button>
              </div>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
