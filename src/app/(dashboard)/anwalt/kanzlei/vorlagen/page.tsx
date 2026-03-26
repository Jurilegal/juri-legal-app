'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Template { id:string; title:string; category:string; content:string; placeholders:Array<{key:string;label:string;default?:string}>; created_at:string }

const PLACEHOLDERS = [
  {key:'mandant_name',label:'Mandantenname'},{key:'mandant_adresse',label:'Mandantenadresse'},
  {key:'gegner_name',label:'Gegnername'},{key:'aktenzeichen',label:'Aktenzeichen'},
  {key:'gericht',label:'Gericht'},{key:'datum',label:'Datum'},{key:'anwalt_name',label:'Anwaltsname'},
  {key:'gegenstandswert',label:'Gegenstandswert'},{key:'frist',label:'Frist'},
]

export default function VorlagenPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Template|null>(null)
  const [form, setForm] = useState({ title:'', category:'schriftsatz', content:'' })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{template:Template;values:Record<string,string>}|null>(null)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('document_templates').select('*').eq('user_id',user.id).order('title')
    setTemplates((data||[]) as Template[]); setLoading(false)
  }
  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const usedPlaceholders = PLACEHOLDERS.filter(p => form.content.includes(`{{${p.key}}}`))
    if(editing) await supabase.from('document_templates').update({...form, placeholders:usedPlaceholders}).eq('id',editing.id)
    else await supabase.from('document_templates').insert({...form, placeholders:usedPlaceholders, user_id:user.id})
    setForm({title:'',category:'schriftsatz',content:''}); setEditing(null); setShowForm(false); setSaving(false); load()
  }
  function insertPlaceholder(key:string) { setForm(f=>({...f, content:f.content+`{{${key}}}`})) }
  function openPreview(t:Template) {
    const values:Record<string,string>={}
    for(const p of t.placeholders) values[p.key] = p.default || ''
    setPreview({template:t, values})
  }
  function getRendered() {
    if(!preview) return ''
    let text = preview.template.content
    for(const [k,v] of Object.entries(preview.values)) text = text.replaceAll(`{{${k}}}`, v||`[${k}]`)
    return text
  }

  if(preview) return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={()=>setPreview(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück</button>
      <h2 className="text-xl font-bold text-navy-800">Vorschau: {preview.template.title}</h2>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Platzhalter ausfüllen</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {preview.template.placeholders.map(p=>(
            <Input key={p.key} label={p.label} value={preview.values[p.key]||''} onChange={e=>setPreview(prev=>prev?{...prev,values:{...prev.values,[p.key]:e.target.value}}:null)}/>
          ))}
        </div>
      </Card>
      <Card className="p-8 bg-white border-2 border-navy-100">
        <div className="whitespace-pre-wrap text-navy-700 leading-relaxed font-serif text-sm">{getRendered()}</div>
      </Card>
      <Button variant="primary" onClick={()=>{const blob=new Blob([getRendered()],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${preview.template.title}.txt`;a.click()}}>📥 Als Textdatei herunterladen</Button>
    </div>
  )

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Dokumenten-Vorlagen</h2>
        <Button variant="primary" size="sm" onClick={()=>{setEditing(null);setForm({title:'',category:'schriftsatz',content:''});setShowForm(!showForm)}}>{showForm?'Abbrechen':'+ Vorlage'}</Button>
      </div>
      {showForm && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Titel *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Kategorie</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                <option value="schriftsatz">Schriftsatz</option><option value="vertrag">Vertrag</option><option value="brief">Brief</option><option value="mahnung">Mahnung</option><option value="sonstige">Sonstige</option>
              </select></div>
          </div>
          <div>
            <label className="text-sm text-navy-400 block mb-1">Platzhalter einfügen</label>
            <div className="flex flex-wrap gap-1 mb-2">{PLACEHOLDERS.map(p=>(
              <button key={p.key} onClick={()=>insertPlaceholder(p.key)} className="px-2 py-1 bg-gold-50 text-gold-700 rounded text-xs cursor-pointer hover:bg-gold-100">{`{{${p.key}}}`}</button>
            ))}</div>
            <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={12} placeholder="Vorlage mit {{platzhaltern}} eingeben..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm font-mono resize-y"/>
          </div>
          <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.title.trim()||!form.content.trim()}>{editing?'Speichern':'Anlegen'}</Button>
        </Card>
      )}
      {templates.length===0?<Card className="p-8 text-center"><span className="text-4xl block mb-3">📝</span><p className="text-navy-400">Noch keine Vorlagen erstellt.</p></Card>:(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{templates.map(t=>(
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div><h3 className="font-semibold text-navy-800">{t.title}</h3><p className="text-xs text-navy-400">{t.category} · {t.placeholders.length} Platzhalter</p></div>
            </div>
            <p className="text-xs text-navy-500 line-clamp-2 mb-3">{t.content.substring(0,120)}...</p>
            <div className="flex gap-2">
              <button onClick={()=>openPreview(t)} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800">👁️ Vorschau</button>
              <button onClick={()=>{setEditing(t);setForm({title:t.title,category:t.category,content:t.content});setShowForm(true)}} className="text-xs text-navy-500 cursor-pointer hover:text-navy-700">✏️ Bearbeiten</button>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
