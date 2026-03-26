'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Case { id:string; reference_number:string|null; title:string; status:string; case_type:string|null; opponent_name:string|null; created_at:string; tags:string[]; parent_case_id:string|null; description:string|null }

const statusMap:Record<string,{label:string;variant:'success'|'warning'|'error'|'neutral'}> = {
  active:{label:'Aktiv',variant:'success'}, open:{label:'Offen',variant:'warning'}, pending:{label:'Ruhend',variant:'neutral'},
  in_progress:{label:'In Bearbeitung',variant:'neutral'}, closed:{label:'Abgeschlossen',variant:'success'}, archived:{label:'Archiviert',variant:'error'},
}

const RECHTSGEBIETE = ['Arbeitsrecht','Familienrecht','Mietrecht','Strafrecht','Verkehrsrecht','Erbrecht','Handelsrecht','Gesellschaftsrecht','Verwaltungsrecht','Sozialrecht','Steuerrecht','Insolvenzrecht','IT-Recht','Medizinrecht','Baurecht','Sonstiges']

export default function AktenPage() {
  const supabase = createClient()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRechtsgebiet, setFilterRechtsgebiet] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', case_type:'', opponent_name:'', description:'', parent_case_id:'', autoAz:true, hourly_rate:'' })
  const [saving, setSaving] = useState(false)

  useEffect(()=>{loadCases()}, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCases() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('cases').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setCases((data||[]) as Case[]); setLoading(false)
  }

  async function generateAktenzeichen(): Promise<string> {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return ''
    const { data:settings } = await supabase.from('kanzlei_settings').select('aktenzeichen_prefix,aktenzeichen_counter').eq('user_id',user.id).single()
    const prefix = settings?.aktenzeichen_prefix || 'AZ'
    const counter = settings?.aktenzeichen_counter || 1
    const year = new Date().getFullYear()
    const az = `${prefix}-${year}-${String(counter).padStart(4,'0')}`
    // Increment counter
    if(settings) await supabase.from('kanzlei_settings').update({aktenzeichen_counter:counter+1}).eq('user_id',user.id)
    else await supabase.from('kanzlei_settings').insert({user_id:user.id, aktenzeichen_prefix:prefix, aktenzeichen_counter:counter+1})
    return az
  }

  async function createCase() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const az = form.autoAz ? await generateAktenzeichen() : ''
    const { data:newCase } = await supabase.from('cases').insert({
      title:form.title, case_type:form.case_type||null, opponent_name:form.opponent_name||null,
      description:form.description||null, reference_number:az||null,
      parent_case_id:form.parent_case_id||null, hourly_rate:form.hourly_rate?parseFloat(form.hourly_rate):null, user_id:user.id, status:'active', tags:[]
    }).select('id').single()
    // Log activity
    if(newCase) {
      await supabase.from('case_activity_log').insert({ case_id:newCase.id, user_id:user.id, action:'akte_erstellt', details:{title:form.title, az} })
    }
    setForm({title:'',case_type:'',opponent_name:'',description:'',parent_case_id:'',autoAz:true,hourly_rate:''})
    setShowForm(false); setSaving(false); loadCases()
  }

  async function exportAkten() {
    const csv = 'Aktenzeichen;Titel;Status;Rechtsgebiet;Gegner;Angelegt\n' +
      cases.map(c=>`${c.reference_number||''};${c.title};${c.status};${c.case_type||''};${c.opponent_name||''};${new Date(c.created_at).toLocaleDateString('de-DE')}`).join('\n')
    const blob = new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Akten-Export.csv'; a.click()
  }

  const parentCases = cases.filter(c=>!c.parent_case_id)
  const filtered = cases.filter(c => {
    if(filterStatus!=='all' && c.status!==filterStatus) return false
    if(filterRechtsgebiet!=='all' && c.case_type!==filterRechtsgebiet) return false
    if(search) {
      const q = search.toLowerCase()
      return c.title.toLowerCase().includes(q) || c.reference_number?.toLowerCase().includes(q) || c.opponent_name?.toLowerCase().includes(q) || c.tags?.some(t=>t.toLowerCase().includes(q))
    }
    return true
  })

  // Group by parent
  const topLevel = filtered.filter(c=>!c.parent_case_id)
  const subCases = (parentId:string) => filtered.filter(c=>c.parent_case_id===parentId)

  if(loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800">Digitale Akten</h2>
          <p className="text-xs text-navy-400">{cases.length} Akten gesamt · {cases.filter(c=>c.status==='active'||c.status==='open'||c.status==='in_progress').length} aktiv</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Suchen (Titel, Az, Gegner, Tags)..." value={search} onChange={e=>setSearch(e.target.value)} className="w-64"/>
          <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>{showForm?'Abbrechen':'+ Neue Akte'}</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-xl border border-navy-200 text-xs">
          <option value="all">Alle Status</option>
          {Object.entries(statusMap).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterRechtsgebiet} onChange={e=>setFilterRechtsgebiet(e.target.value)} className="px-3 py-1.5 rounded-xl border border-navy-200 text-xs">
          <option value="all">Alle Rechtsgebiete</option>
          {RECHTSGEBIETE.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={exportAkten} className="px-3 py-1.5 text-xs text-gold-600 cursor-pointer hover:text-gold-800">📥 CSV Export</button>
      </div>

      {showForm && (
        <Card className="p-6 space-y-3">
          <h3 className="font-semibold text-navy-800">Neue Akte anlegen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Titel *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            <div><label className="text-sm text-navy-400 block mb-1">Rechtsgebiet</label>
              <select value={form.case_type} onChange={e=>setForm(f=>({...f,case_type:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                <option value="">— wählen —</option>{RECHTSGEBIETE.map(r=><option key={r}>{r}</option>)}
              </select></div>
            <Input label="Gegner" value={form.opponent_name} onChange={e=>setForm(f=>({...f,opponent_name:e.target.value}))}/>
            <Input label="Stundensatz (€, optional)" type="number" value={form.hourly_rate} onChange={e=>setForm(f=>({...f,hourly_rate:e.target.value}))} placeholder="z.B. 300"/>
            <div><label className="text-sm text-navy-400 block mb-1">Übergeordnete Akte (für Unterakte)</label>
              <select value={form.parent_case_id} onChange={e=>setForm(f=>({...f,parent_case_id:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                <option value="">Keine (eigenständige Akte)</option>
                {parentCases.map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
              </select></div>
          </div>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="Beschreibung..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"/>
          <label className="flex items-center gap-2 text-sm text-navy-600"><input type="checkbox" checked={form.autoAz} onChange={e=>setForm(f=>({...f,autoAz:e.target.checked}))}/> Aktenzeichen automatisch vergeben</label>
          <Button variant="primary" size="sm" onClick={createCase} loading={saving} disabled={!form.title.trim()}>Akte anlegen</Button>
        </Card>
      )}

      {filtered.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Keine Akten gefunden.</p></Card>:(
        <div className="space-y-2">{topLevel.map(c=>{
          const st = statusMap[c.status]||{label:c.status,variant:'neutral' as const}
          const subs = subCases(c.id)
          return(
            <div key={c.id}>
              <Card className="p-4 cursor-pointer hover:border-gold-300 transition-all" onClick={()=>router.push(`/anwalt/kanzlei/akten/${c.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {c.reference_number && <span className="text-xs bg-navy-100 text-navy-500 px-2 py-0.5 rounded font-mono">{c.reference_number}</span>}
                      <span className="font-medium text-navy-800">{c.title}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {subs.length>0 && <span className="text-xs bg-gold-50 text-gold-600 px-2 py-0.5 rounded">{subs.length} Unterakte{subs.length>1?'n':''}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {c.case_type && <span className="text-xs text-navy-400">{c.case_type}</span>}
                      {c.opponent_name && <span className="text-xs text-navy-400">· Gegner: {c.opponent_name}</span>}
                      {c.tags?.length>0 && c.tags.map(t=><span key={t} className="text-[10px] bg-gold-50 text-gold-600 px-1.5 py-0.5 rounded">#{t}</span>)}
                    </div>
                  </div>
                  <span className="text-xs text-navy-300">{new Date(c.created_at).toLocaleDateString('de-DE')}</span>
                </div>
              </Card>
              {/* Unterakten */}
              {subs.length>0 && (
                <div className="ml-6 mt-1 space-y-1">{subs.map(sub=>{
                  const subSt = statusMap[sub.status]||{label:sub.status,variant:'neutral' as const}
                  return(
                    <Card key={sub.id} className="p-3 cursor-pointer hover:border-gold-300 border-l-4 border-l-gold-300" onClick={()=>router.push(`/anwalt/kanzlei/akten/${sub.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-navy-300">↳</span>
                          {sub.reference_number && <span className="text-[10px] bg-navy-50 text-navy-400 px-1.5 py-0.5 rounded font-mono">{sub.reference_number}</span>}
                          <span className="text-sm text-navy-700">{sub.title}</span>
                          <Badge variant={subSt.variant}>{subSt.label}</Badge>
                        </div>
                        <span className="text-xs text-navy-300">{new Date(sub.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    </Card>
                  )
                })}</div>
              )}
            </div>
          )
        })}</div>
      )}
    </div>
  )
}
