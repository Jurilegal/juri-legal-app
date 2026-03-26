'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Template { id:string; name:string; case_type:string; description:string|null; default_tasks:string[]; default_tags:string[]; default_documents:string[]; created_at:string }

const RECHTSGEBIETE = ['Arbeitsrecht','Familienrecht','Mietrecht','Strafrecht','Verkehrsrecht','Erbrecht','Handelsrecht','Gesellschaftsrecht','Verwaltungsrecht','Sozialrecht','Steuerrecht','Insolvenzrecht','IT-Recht','Medizinrecht','Baurecht','Sonstiges']

export default function AktenvorlagenPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', case_type:'Arbeitsrecht', description:'', tasks:'', tags:'', documents:'' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)

  useEffect(()=>{load()},[]) // eslint-disable-line
  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('case_templates').select('*').eq('user_id',user.id).order('name')
    setTemplates((data||[]) as Template[])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const payload = {
      user_id: user.id,
      name: form.name,
      case_type: form.case_type,
      description: form.description||null,
      default_tasks: form.tasks.split('\n').filter(Boolean),
      default_tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
      default_documents: form.documents.split('\n').filter(Boolean),
    }
    if(editId) {
      await supabase.from('case_templates').update(payload).eq('id',editId)
    } else {
      await supabase.from('case_templates').insert(payload)
    }
    setForm({ name:'',case_type:'Arbeitsrecht',description:'',tasks:'',tags:'',documents:'' })
    setShowForm(false); setEditId(null); setSaving(false); load()
  }

  async function useTemplate(t:Template) {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    // Generate auto Aktenzeichen
    const year = new Date().getFullYear()
    const { count } = await supabase.from('cases').select('*',{count:'exact',head:true}).eq('user_id',user.id)
    const nr = String((count||0)+1).padStart(4,'0')
    const az = `${year}/${nr}`
    const { data:newCase } = await supabase.from('cases').insert({
      user_id:user.id, title:`${t.name} — Neues Mandat`, case_type:t.case_type, status:'active',
      reference_number:az, tags:t.default_tags, description:t.description||''
    }).select('id').single()
    if(newCase) {
      // Create default tasks as deadlines
      for(const task of t.default_tasks) {
        await supabase.from('deadlines').insert({ user_id:user.id, case_id:newCase.id, title:task, status:'open', priority:'medium', due_date:new Date(Date.now()+7*86400000).toISOString().split('T')[0] })
      }
      window.location.href = `/anwalt/kanzlei/akten/${newCase.id}`
    }
  }

  async function deleteTemplate(id:string) {
    if(!confirm('Vorlage wirklich löschen?')) return
    await supabase.from('case_templates').delete().eq('id',id)
    load()
  }

  function startEdit(t:Template) {
    setForm({ name:t.name, case_type:t.case_type, description:t.description||'', tasks:t.default_tasks.join('\n'), tags:t.default_tags.join(', '), documents:t.default_documents.join('\n') })
    setEditId(t.id); setShowForm(true)
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-navy-800">Aktenvorlagen</h2><p className="text-sm text-navy-400">Vorlagen für wiederkehrende Mandatsarten</p></div>
        <Button variant="primary" size="sm" onClick={()=>{setShowForm(!showForm);setEditId(null);setForm({name:'',case_type:'Arbeitsrecht',description:'',tasks:'',tags:'',documents:''})}}>
          {showForm?'Abbrechen':'+ Neue Vorlage'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-navy-800">{editId?'Vorlage bearbeiten':'Neue Vorlage'}</h3>
          <Input label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="z.B. Kündigungsschutzklage"/>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Rechtsgebiet</label>
            <select value={form.case_type} onChange={e=>setForm({...form,case_type:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm">
              {RECHTSGEBIETE.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Beschreibung</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm resize-y" placeholder="Kurze Beschreibung der Vorlage"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Standard-Aufgaben (je Zeile eine)</label>
            <textarea value={form.tasks} onChange={e=>setForm({...form,tasks:e.target.value})} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm resize-y" placeholder="Mandantengespräch führen&#10;Klageschrift entwerfen&#10;Gütetermin vorbereiten"/>
          </div>
          <Input label="Tags (kommagetrennt)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="arbeitsrecht, kündigung, klage"/>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Standard-Dokumente (je Zeile eines)</label>
            <textarea value={form.documents} onChange={e=>setForm({...form,documents:e.target.value})} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm resize-y" placeholder="Vollmacht&#10;Klageschrift&#10;Kostenrechnung"/>
          </div>
          <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.name.trim()}>
            {editId?'Aktualisieren':'Vorlage speichern'}
          </Button>
        </Card>
      )}

      {templates.length===0 && !showForm && (
        <Card className="p-8 text-center">
          <p className="text-navy-400 mb-4">Noch keine Aktenvorlagen erstellt.</p>
          <p className="text-sm text-navy-300">Erstellen Sie Vorlagen für wiederkehrende Mandatsarten wie Kündigungsschutzklage, Scheidung oder Mietstreit.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t=>(
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-navy-800">{t.name}</h3>
                <Badge variant="neutral">{t.case_type}</Badge>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>startEdit(t)} className="text-navy-400 hover:text-navy-600 text-xs cursor-pointer">✏️</button>
                <button onClick={()=>deleteTemplate(t.id)} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">🗑️</button>
              </div>
            </div>
            {t.description && <p className="text-sm text-navy-500 mb-3">{t.description}</p>}
            {t.default_tasks.length>0 && (
              <div className="mb-2"><p className="text-xs font-medium text-navy-500">Aufgaben:</p>
                {t.default_tasks.map((task,i)=><p key={i} className="text-xs text-navy-400">• {task}</p>)}
              </div>
            )}
            {t.default_tags.length>0 && (
              <div className="flex gap-1 flex-wrap mb-3">{t.default_tags.map(tag=><span key={tag} className="px-2 py-0.5 bg-gold-50 text-gold-700 rounded text-xs">#{tag}</span>)}</div>
            )}
            <Button variant="primary" size="sm" onClick={()=>useTemplate(t)}>📁 Akte aus Vorlage erstellen</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
