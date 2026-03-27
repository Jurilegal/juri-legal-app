'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Doc { id:string; case_id:string; file_name:string; file_path:string; file_size:number|null; mime_type:string|null; folder:string|null; version:number; created_at:string; cases?:{title:string;reference_number:string|null} }

export default function DokumentViewerPage() {
  const supabase = createClient()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Doc|null>(null)
  const [previewUrl, setPreviewUrl] = useState<string|null>(null)
  const [filter, setFilter] = useState('')
  const [folderFilter, setFolderFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(()=>{load()},[]) // eslint-disable-line

  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('case_documents').select('*,cases(title,reference_number)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(200)
    setDocs((data||[]) as Doc[])
    setLoading(false)
  }

  async function selectDoc(doc:Doc) {
    setSelected(doc)
    setPreviewUrl(null)
    const bucket = 'documents'
    const { data } = await supabase.storage.from(bucket).createSignedUrl(doc.file_path, 3600)
    if(data?.signedUrl) setPreviewUrl(data.signedUrl)
  }

  function formatSize(bytes:number|null) {
    if(!bytes) return '—'
    if(bytes<1024) return bytes+' B'
    if(bytes<1048576) return (bytes/1024).toFixed(1)+' KB'
    return (bytes/1048576).toFixed(1)+' MB'
  }

  const folders = [...new Set(docs.map(d=>d.folder).filter(Boolean))]
  const types = [...new Set(docs.map(d=>{const ext=d.file_name.split('.').pop()?.toLowerCase();return ext||'unbekannt'}))]
  const isPDF = selected?.mime_type?.includes('pdf') || selected?.file_name.endsWith('.pdf')
  const isImage = selected?.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(selected?.file_name||'')

  const filtered = docs.filter(d=>{
    if(filter && !`${d.file_name} ${(d.cases as {title:string}|undefined)?.title||''}`.toLowerCase().includes(filter.toLowerCase())) return false
    if(folderFilter && d.folder!==folderFilter) return false
    if(typeFilter && !d.file_name.toLowerCase().endsWith('.'+typeFilter)) return false
    return true
  })

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Sidebar - Document List */}
      <div className="w-80 flex-shrink-0 flex flex-col space-y-3">
        <h2 className="text-xl font-bold text-navy-800">📄 Dokument-Viewer</h2>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="🔍 Dokument suchen..." className="px-3 py-2 rounded-xl border border-navy-200 text-sm"/>
        <div className="flex gap-2">
          <select value={folderFilter} onChange={e=>setFolderFilter(e.target.value)} className="flex-1 px-2 py-1 rounded-lg border border-navy-200 text-xs">
            <option value="">Alle Ordner</option>
            {folders.map(f=><option key={f} value={f!}>{f}</option>)}
          </select>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="flex-1 px-2 py-1 rounded-lg border border-navy-200 text-xs">
            <option value="">Alle Typen</option>
            {types.map(t=><option key={t} value={t}>.{t}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {filtered.length===0 ? <p className="text-sm text-navy-400 text-center py-4">Keine Dokumente gefunden</p> :
          filtered.map(d=>(
            <button key={d.id} onClick={()=>selectDoc(d)} className={`w-full text-left p-3 rounded-xl cursor-pointer transition-colors ${selected?.id===d.id?'bg-gold-50 border border-gold-300':'bg-white border border-navy-100 hover:border-gold-200'}`}>
              <p className="text-sm font-medium text-navy-800 truncate">{d.file_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {d.folder && <span className="text-[10px] bg-navy-100 text-navy-500 px-1.5 py-0.5 rounded">{d.folder}</span>}
                <span className="text-[10px] text-navy-400">{formatSize(d.file_size)}</span>
                {d.version>1 && <span className="text-[10px] text-gold-500">v{d.version}</span>}
              </div>
              {(d.cases as {title:string}|undefined)?.title && <p className="text-[10px] text-navy-400 mt-1 truncate">📁 {(d.cases as {title:string}).title}</p>}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-navy-400 text-center">{filtered.length} Dokument{filtered.length!==1?'e':''}</p>
      </div>

      {/* Main - Preview */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-navy-800">{selected.file_name}</h3>
                <p className="text-xs text-navy-400">
                  {selected.folder && <span>{selected.folder} · </span>}
                  {formatSize(selected.file_size)} · Version {selected.version} · {new Date(selected.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="flex gap-2">
                {previewUrl && <a href={previewUrl} download={selected.file_name}><Button variant="secondary" size="sm">📥 Download</Button></a>}
                {selected.case_id && <a href={`/anwalt/kanzlei/akten/${selected.case_id}`}><Button variant="secondary" size="sm">📁 Zur Akte</Button></a>}
              </div>
            </div>
            <Card className="flex-1 overflow-hidden">
              {previewUrl ? (
                isPDF ? (
                  <iframe src={previewUrl} className="w-full h-full min-h-[500px]" title={selected.file_name}/>
                ) : isImage ? (
                  <div className="flex items-center justify-center h-full p-4 bg-navy-50">
                    <img src={previewUrl} alt={selected.file_name} className="max-w-full max-h-full object-contain rounded-lg shadow-md"/>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <p className="text-4xl">📄</p>
                      <p className="text-navy-500">Vorschau für diesen Dateityp nicht verfügbar</p>
                      <a href={previewUrl} download={selected.file_name}><Button variant="primary" size="sm">📥 Herunterladen</Button></a>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/>
                </div>
              )}
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-5xl">📂</p>
              <p className="text-navy-500">Wählen Sie ein Dokument aus der Liste</p>
              <p className="text-xs text-navy-400">PDF- und Bild-Dateien werden direkt angezeigt</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
