'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DragDropUpload } from '@/components/DragDropUpload'

interface CaseDetail { id:string; title:string; description:string|null; status:string; reference_number:string|null; tags:string[]; opponent_name:string|null; custom_fields:Record<string,string>|null; created_at:string; parent_case_id:string|null }
interface Note { id:string; content:string; note_type:string; created_at:string; updated_at:string }
interface Activity { id:string; action:string; details:Record<string,unknown>|null; created_at:string }
interface Doc { id:string; name:string; folder:string; version:number; status:string|null; created_at:string }
interface Deadline { id:string; title:string; due_date:string; status:string; priority:string }

export default function AkteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [caseData, setCaseData] = useState<CaseDetail|null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview'|'notes'|'docs'|'deadlines'|'activity'>('overview')
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('notiz')
  const [savingNote, setSavingNote] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [uploading, setUploading] = useState(false)
  const [linkedCases, setLinkedCases] = useState<{id:string;linked_case_id:string;link_type:string;title?:string}[]>([])
  const [allCases, setAllCases] = useState<{id:string;title:string;reference_number:string|null}[]>([])
  const [docFolder, setDocFolder] = useState('/')
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(()=>{load()}, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const [r1,r2,r3,r4,r5] = await Promise.all([
      supabase.from('cases').select('*').eq('id',id).eq('user_id',user.id).single(),
      supabase.from('case_notes').select('*').eq('case_id',id).order('created_at',{ascending:false}),
      supabase.from('case_activity_log').select('*').eq('case_id',id).order('created_at',{ascending:false}).limit(50),
      supabase.from('case_documents').select('*').eq('case_id',id).order('created_at',{ascending:false}),
      supabase.from('deadlines').select('id,title,due_date,status,priority').eq('case_id',id).order('due_date'),
    ])
    setCaseData(r1.data as CaseDetail|null)
    setNotes((r2.data||[]) as Note[])
    setActivities((r3.data||[]) as Activity[])
    setDocs((r4.data||[]) as Doc[])
    setDeadlines((r5.data||[]) as Deadline[])
    // Load linked cases
    const { data:links } = await supabase.from('case_links').select('*').eq('case_id',id)
    const { data:ac } = await supabase.from('cases').select('id,title,reference_number').eq('user_id',user.id)
    setAllCases((ac||[]) as typeof allCases)
    if(links?.length) {
      const mapped = links.map(l => {
        const c = (ac||[]).find(a=>a.id===l.linked_case_id)
        return { ...l, title: c?.title }
      })
      setLinkedCases(mapped)
    }
    setLoading(false)
  }
  async function addNote() {
    if(!noteText.trim()) return
    setSavingNote(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('case_notes').insert({ case_id:id, user_id:user.id, content:noteText, note_type:noteType })
    await logActivity(user.id, 'notiz_erstellt', { note_type:noteType })
    setNoteText(''); setSavingNote(false); load()
  }
  async function logActivity(userId:string, action:string, details?:Record<string,unknown>) {
    await supabase.from('case_activity_log').insert({ case_id:id, user_id:userId, action, details:details||null })
  }
  async function addTag() {
    if(!newTag.trim()||!caseData) return
    const tags = [...(caseData.tags||[]), newTag.trim()]
    await supabase.from('cases').update({tags}).eq('id',id)
    setNewTag(''); load()
  }
  async function removeTag(tag:string) {
    if(!caseData) return
    const tags = (caseData.tags||[]).filter(t=>t!==tag)
    await supabase.from('cases').update({tags}).eq('id',id)
    load()
  }
  async function updateStatus(status:string) {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('cases').update({status}).eq('id',id)
    await logActivity(user.id, 'status_geaendert', { von:caseData?.status, nach:status })
    load()
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>
  if(!caseData) return <Card className="p-8 text-center"><p className="text-navy-400">Akte nicht gefunden.</p></Card>

  const filteredDocs = docFolder==='/'?docs:docs.filter(d=>d.folder===docFolder)
  const statusColors:Record<string,string> = { active:'success', pending:'warning', closed:'neutral', archived:'neutral' }
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-navy-800">{caseData.title}</h2>
            <Badge variant={(statusColors[caseData.status] as 'success'|'warning'|'neutral'|'error')||'neutral'}>{caseData.status}</Badge>
          </div>
          {caseData.reference_number && <p className="text-sm text-navy-400">Az: {caseData.reference_number}</p>}
          {caseData.opponent_name && <p className="text-sm text-navy-400">Gegner: {caseData.opponent_name}</p>}
          <p className="text-xs text-navy-300 mt-1">Angelegt: {new Date(caseData.created_at).toLocaleDateString('de-DE')}</p>
        </div>
        <div className="flex gap-2">
          <select value={caseData.status} onChange={e=>updateStatus(e.target.value)} className="px-3 py-1.5 rounded-xl border border-navy-200 text-xs">
            <option value="active">Aktiv</option><option value="pending">Ruhend</option><option value="closed">Abgeschlossen</option><option value="archived">Archiviert</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {(caseData.tags||[]).map(t=>(
          <span key={t} className="flex items-center gap-1 px-2 py-1 bg-gold-50 text-gold-700 rounded-lg text-xs">
            #{t} <button onClick={()=>removeTag(t)} className="text-gold-400 cursor-pointer hover:text-gold-600">×</button>
          </span>
        ))}
        <div className="flex gap-1">
          <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()} placeholder="+ Tag" className="px-2 py-1 border border-navy-200 rounded-lg text-xs w-24"/>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-navy-100 pb-1">
        {[{key:'overview' as const,label:'Übersicht'},{key:'notes' as const,label:`Notizen (${notes.length})`},{key:'docs' as const,label:`Dokumente (${docs.length})`},{key:'deadlines' as const,label:`Fristen (${deadlines.length})`},{key:'activity' as const,label:'Aktivität'}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} className={`px-4 py-2 text-sm cursor-pointer rounded-t-xl ${tab===t.key?'bg-white border border-b-0 border-navy-100 font-medium text-navy-800':' text-navy-400 hover:text-navy-600'}`}>{t.label}</button>
        ))}
      </div>

      {/* Overview */}
      {tab==='overview' && (
        <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4"><p className="text-xs text-navy-400">Dokumente</p><p className="text-2xl font-bold text-navy-900">{docs.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-navy-400">Offene Fristen</p><p className="text-2xl font-bold text-amber-600">{deadlines.filter(d=>d.status!=='done').length}</p></Card>
          <Card className="p-4"><p className="text-xs text-navy-400">Notizen</p><p className="text-2xl font-bold text-navy-900">{notes.length}</p></Card>
          {caseData.description && <Card className="p-5 sm:col-span-3"><h3 className="text-sm font-semibold text-navy-800 mb-2">Beschreibung</h3><p className="text-sm text-navy-600 whitespace-pre-wrap">{caseData.description}</p></Card>}
        </div>
        {/* Linked Cases */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-navy-800">Verknüpfte Akten ({linkedCases.length})</h3>
          </div>
          {linkedCases.map(l=>(
            <div key={l.id} className="flex items-center justify-between p-2 bg-navy-50 rounded-xl mb-1">
              <span className="text-sm text-navy-700">📁 {l.title||'Unbekannt'}</span>
              <Badge variant="neutral">{l.link_type}</Badge>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <select id="linkCase" className="flex-1 px-3 py-1.5 rounded-xl border border-navy-200 text-xs">
              <option value="">Akte verknüpfen...</option>
              {allCases.filter(c=>c.id!==id&&!linkedCases.some(l=>l.linked_case_id===c.id)).map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
            </select>
            <button onClick={async()=>{
              const sel = (document.getElementById('linkCase') as HTMLSelectElement)?.value
              if(!sel) return
              await supabase.from('case_links').insert({case_id:id, linked_case_id:sel, link_type:'verwandt'})
              load()
            }} className="px-3 py-1.5 bg-navy-800 text-white rounded-xl text-xs cursor-pointer">Verknüpfen</button>
          </div>
        </Card>
        </div>
      )}

      {/* Notes */}
      {tab==='notes' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex gap-2">
              <select value={noteType} onChange={e=>setNoteType(e.target.value)} className="px-3 py-2 rounded-xl border border-navy-200 text-sm">
                <option value="notiz">Notiz</option><option value="vermerk">Vermerk</option><option value="verfuegung">Verfügung</option><option value="telefonnotiz">Telefonnotiz</option>
              </select>
            </div>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={3} placeholder="Notiz eingeben..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"/>
            <Button variant="primary" size="sm" onClick={addNote} loading={savingNote} disabled={!noteText.trim()}>Notiz speichern</Button>
          </Card>
          {notes.map(n=>(
            <Card key={n.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="neutral">{n.note_type}</Badge>
                <span className="text-xs text-navy-400">{new Date(n.created_at).toLocaleString('de-DE')}</span>
              </div>
              <p className="text-sm text-navy-700 whitespace-pre-wrap">{n.content}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Docs with folder structure & versioning */}
      {tab==='docs' && (
        <div className="space-y-4">
          {/* Folder navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-navy-400">Ordner:</span>
            {['/','/Schriftsätze','/Korrespondenz','/Verträge','/Beweise','/Rechnungen','/Sonstiges'].map(f=>(
              <button key={f} onClick={()=>setDocFolder(f)} className={`px-2 py-1 rounded text-xs cursor-pointer ${docFolder===f?'bg-navy-800 text-white':'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>
                📁 {f==='/'?'Alle':f.slice(1)}
              </button>
            ))}
            <div className="flex-1"/>
            <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} placeholder="Neuer Ordner..." className="px-2 py-1 border border-navy-200 rounded text-xs w-32"/>
            <button onClick={()=>{if(newFolderName.trim()){setDocFolder('/'+newFolderName.trim());setNewFolderName('')}}} className="text-xs text-gold-600 cursor-pointer">+ Ordner</button>
          </div>
          <DragDropUpload uploading={uploading} onFilesSelected={async(files)=>{
            setUploading(true)
            const { data:{user} } = await supabase.auth.getUser()
            if(!user) return
            for(const file of files) {
              const path = `kanzlei/${user.id}/${id}/${Date.now()}-${file.name}`
              await supabase.storage.from('lawyer-documents').upload(path, file)
              await supabase.from('case_documents').insert({ case_id:id, user_id:user.id, name:file.name, file_path:path, original_filename:file.name, mime_type:file.type, file_size:file.size, folder:docFolder==='/'?'/':docFolder, version:1 })
              await logActivity(user.id, 'dokument_hochgeladen', {name:file.name, folder:docFolder})
            }
            setUploading(false); load()
          }}/>
          {filteredDocs.length===0?<p className="text-sm text-navy-400">Keine Dokumente{docFolder!=='/'?` in ${docFolder}`:''}</p>:
          filteredDocs.map(d=>(
            <Card key={d.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-navy-800">📄 {d.name}</span>
                  <span className="text-xs text-navy-400">{d.folder!=='/'?d.folder:''}</span>
                  <span className="text-[10px] bg-navy-50 text-navy-400 px-1.5 py-0.5 rounded">v{d.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  {d.status && <Badge variant="neutral">{d.status}</Badge>}
                  <button onClick={async()=>{
                    // New version upload
                    const input = document.createElement('input'); input.type='file'
                    input.onchange=async(e)=>{
                      const file=(e.target as HTMLInputElement).files?.[0]; if(!file) return
                      setUploading(true)
                      const { data:{user} } = await supabase.auth.getUser(); if(!user) return
                      const path=`kanzlei/${user.id}/${id}/${Date.now()}-${file.name}`
                      await supabase.storage.from('lawyer-documents').upload(path,file)
                      await supabase.from('case_documents').insert({case_id:id,user_id:user.id,name:d.name,file_path:path,original_filename:file.name,mime_type:file.type,file_size:file.size,folder:d.folder,version:d.version+1,parent_document_id:d.id})
                      await logActivity(user.id,'dokument_version',{name:d.name,version:d.version+1})
                      setUploading(false); load()
                    }; input.click()
                  }} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800" title="Neue Version hochladen">📤</button>
                  <button onClick={async()=>{
                    if(!confirm(`Dokument "${d.name}" löschen?`)) return
                    await supabase.from('case_documents').delete().eq('id',d.id)
                    load()
                  }} className="text-xs text-red-400 cursor-pointer hover:text-red-600">🗑️</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deadlines */}
      {tab==='deadlines' && (
        <div className="space-y-2">
          {deadlines.length===0?<p className="text-sm text-navy-400">Keine Fristen.</p>:
          deadlines.map(d=>{
            const overdue = d.status!=='done'&&d.due_date<today
            return(
              <Card key={d.id} className={`p-3 ${overdue?'border-red-200':''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${d.status==='done'?'line-through text-navy-400':'text-navy-800'}`}>{d.title}</span>
                    {overdue && <Badge variant="error">Überfällig</Badge>}
                  </div>
                  <span className="text-xs text-navy-400">{new Date(d.due_date).toLocaleDateString('de-DE')}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Activity Log */}
      {tab==='activity' && (
        <div className="space-y-2">
          {activities.length===0?<p className="text-sm text-navy-400">Noch keine Aktivitäten.</p>:
          activities.map(a=>(
            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-navy-50">
              <span className="text-xs bg-navy-50 text-navy-500 px-2 py-1 rounded mt-0.5">{
                a.action==='status_geaendert'?'📊':a.action==='notiz_erstellt'?'📝':a.action==='dokument_hochgeladen'?'📄':'⚡'
              }</span>
              <div>
                <p className="text-sm text-navy-700">{
                  a.action==='status_geaendert'?`Status geändert: ${(a.details as Record<string,string>)?.von} → ${(a.details as Record<string,string>)?.nach}`:
                  a.action==='notiz_erstellt'?`Notiz erstellt (${(a.details as Record<string,string>)?.note_type||'Notiz'})`:
                  a.action
                }</p>
                <p className="text-xs text-navy-400">{new Date(a.created_at).toLocaleString('de-DE')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
