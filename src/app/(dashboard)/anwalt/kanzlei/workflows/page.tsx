'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Workflow { id:string; name:string; description:string|null; trigger_type:string; steps:Array<{title:string;description:string;assignee?:string;days_offset:number}>; is_active:boolean; created_at:string }

const triggerTypes = [
  {value:'neue_akte',label:'Neue Akte angelegt'},{value:'frist_faellig',label:'Frist fällig'},
  {value:'rechnung_erstellt',label:'Rechnung erstellt'},{value:'mandant_neu',label:'Neuer Mandant'},
  {value:'mahnung_eskaliert',label:'Mahnung eskaliert'},{value:'manuell',label:'Manuell gestartet'},
]

const PRESETS = [
  { name:'Mandatsannahme', trigger:'neue_akte', steps:[
    {title:'Mandantenakte anlegen',description:'Stammdaten erfassen',days_offset:0},
    {title:'Kollisionsprüfung',description:'Interessenkonflikte prüfen',days_offset:0},
    {title:'Vollmacht einholen',description:'Mandatsvereinbarung + Vollmacht senden',days_offset:1},
    {title:'Erstberatung planen',description:'Termin für Erstgespräch vereinbaren',days_offset:2},
    {title:'Aktenzeichen vergeben',description:'Internes AZ zuweisen + Akte strukturieren',days_offset:2},
  ]},
  { name:'Klageverfahren', trigger:'manuell', steps:[
    {title:'Klageschrift erstellen',description:'Entwurf der Klageschrift',days_offset:0},
    {title:'Kostenvorschuss anfordern',description:'Gerichtskosten-Vorschuss vom Mandanten',days_offset:1},
    {title:'Klage einreichen',description:'Über beA an Gericht senden',days_offset:3},
    {title:'Zustellungsüberwachung',description:'Zustellung an Gegner prüfen',days_offset:14},
    {title:'Klageerwiderungsfrist',description:'Frist für Gegner notieren',days_offset:28},
    {title:'Verhandlungsvorbereitung',description:'Schriftsätze + Beweismittel zusammenstellen',days_offset:42},
  ]},
  { name:'Forderungsbeitreibung', trigger:'manuell', steps:[
    {title:'1. Mahnung senden',description:'Zahlungserinnerung mit Frist',days_offset:0},
    {title:'2. Mahnung senden',description:'Letzte Mahnung vor gerichtlichem Mahnverfahren',days_offset:14},
    {title:'Mahnbescheid beantragen',description:'Online-Mahnantrag stellen',days_offset:28},
    {title:'Vollstreckungsbescheid',description:'Nach Ablauf der Widerspruchsfrist',days_offset:42},
    {title:'Zwangsvollstreckung',description:'Gerichtsvollzieher beauftragen',days_offset:56},
  ]},
]

export default function WorkflowsPage() {
  const supabase = createClient()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', trigger_type:'manuell', steps:[{title:'',description:'',days_offset:0}] as Array<{title:string;description:string;days_offset:number}> })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string|null>(null)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('workflow_templates').select('*').eq('user_id',user.id).order('name')
    setWorkflows((data||[]) as Workflow[]); setLoading(false)
  }
  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('workflow_templates').insert({ user_id:user.id, name:form.name, description:form.description||null, trigger_type:form.trigger_type, steps:form.steps.filter(s=>s.title.trim()) })
    setForm({name:'',description:'',trigger_type:'manuell',steps:[{title:'',description:'',days_offset:0}]}); setShowForm(false); setSaving(false); load()
  }
  function usePreset(p:typeof PRESETS[0]) {
    setForm({name:p.name, description:'', trigger_type:p.trigger, steps:p.steps}); setShowForm(true)
  }
  async function toggleActive(w:Workflow) {
    await supabase.from('workflow_templates').update({is_active:!w.is_active}).eq('id',w.id); load()
  }
  async function del(id:string) { if(!confirm('Workflow löschen?')) return; await supabase.from('workflow_templates').delete().eq('id',id); load() }
  function addStep() { setForm(f=>({...f, steps:[...f.steps, {title:'',description:'',days_offset:0}]})) }
  function removeStep(i:number) { setForm(f=>({...f, steps:f.steps.filter((_,j)=>j!==i)})) }
  function updateStep(i:number, key:string, val:string|number) { setForm(f=>({...f, steps:f.steps.map((s,j)=>j===i?{...s,[key]:val}:s)})) }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Workflow-Automatisierung</h2>
        <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>{showForm?'Abbrechen':'+ Neuer Workflow'}</Button>
      </div>

      {/* Presets */}
      {!showForm && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Vorlagen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map(p=>(
              <button key={p.name} onClick={()=>usePreset(p)} className="p-4 bg-navy-50 rounded-xl text-left cursor-pointer hover:bg-navy-100 transition-colors">
                <p className="font-medium text-navy-800 text-sm">{p.name}</p>
                <p className="text-xs text-navy-400 mt-1">{p.steps.length} Schritte</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Auslöser</label>
              <select value={form.trigger_type} onChange={e=>setForm(f=>({...f,trigger_type:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                {triggerTypes.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </select></div>
          </div>
          <Input label="Beschreibung" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-navy-800">Schritte</label>
              <button onClick={addStep} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800">+ Schritt hinzufügen</button>
            </div>
            <div className="space-y-3">
              {form.steps.map((s,i)=>(
                <div key={i} className="flex gap-2 items-start p-3 bg-navy-50 rounded-xl">
                  <span className="text-xs font-bold text-navy-400 mt-2 w-6">{i+1}.</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input value={s.title} onChange={e=>updateStep(i,'title',e.target.value)} placeholder="Schritt-Titel *" className="px-3 py-2 rounded-lg border border-navy-200 text-sm"/>
                    <input value={s.description} onChange={e=>updateStep(i,'description',e.target.value)} placeholder="Beschreibung" className="px-3 py-2 rounded-lg border border-navy-200 text-sm"/>
                    <div className="flex gap-2">
                      <input type="number" value={s.days_offset} onChange={e=>updateStep(i,'days_offset',parseInt(e.target.value)||0)} className="w-20 px-3 py-2 rounded-lg border border-navy-200 text-sm" title="Tage ab Start"/>
                      <span className="text-xs text-navy-400 self-center">Tage</span>
                      {form.steps.length>1 && <button onClick={()=>removeStep(i)} className="text-red-400 cursor-pointer text-sm">🗑️</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.name.trim()||!form.steps.some(s=>s.title.trim())}>Workflow speichern</Button>
        </Card>
      )}

      {workflows.length===0 && !showForm ? <Card className="p-8 text-center"><span className="text-4xl block mb-3">⚙️</span><p className="text-navy-400">Noch keine Workflows erstellt. Nutzen Sie eine Vorlage oben oder erstellen Sie einen eigenen.</p></Card> : (
        <div className="space-y-3">{workflows.map(w=>(
          <Card key={w.id} className="p-5">
            <div className="flex items-start justify-between cursor-pointer" onClick={()=>setExpanded(expanded===w.id?null:w.id)}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-navy-800">{w.name}</span>
                  <Badge variant={w.is_active?'success':'neutral'}>{w.is_active?'Aktiv':'Inaktiv'}</Badge>
                  <span className="text-xs bg-navy-50 text-navy-500 px-2 py-0.5 rounded">{triggerTypes.find(t=>t.value===w.trigger_type)?.label||w.trigger_type}</span>
                </div>
                {w.description && <p className="text-xs text-navy-400 mt-1">{w.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-400">{w.steps.length} Schritte</span>
                <span className="text-navy-400">{expanded===w.id?'▲':'▼'}</span>
              </div>
            </div>
            {expanded===w.id && (
              <div className="mt-4 pt-4 border-t border-navy-100">
                <div className="space-y-2">{w.steps.map((s,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
                    <span className="w-7 h-7 rounded-full bg-gold-400 text-white text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-navy-800">{s.title}</p>
                      {s.description && <p className="text-xs text-navy-400">{s.description}</p>}
                    </div>
                    <span className="text-xs text-navy-400">Tag {s.days_offset}</span>
                  </div>
                ))}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>toggleActive(w)} className="text-xs text-navy-500 cursor-pointer">{w.is_active?'⏸️ Deaktivieren':'▶️ Aktivieren'}</button>
                  <button onClick={()=>del(w.id)} className="text-xs text-red-400 cursor-pointer">🗑️ Löschen</button>
                </div>
              </div>
            )}
          </Card>
        ))}</div>
      )}
    </div>
  )
}
