'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Doc { id:string; name:string; file_path:string; case_id:string; status:string; category:string; created_at:string; size?:number }

export default function DokumentViewerPage() {
  const supabase = createClient()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Doc|null>(null)
  const [previewUrl, setPreviewUrl] = useState<string|null>(null)
  const [search, setSearch] = useState('')

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('case_documents').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setDocs((data||[]) as Doc[]); setLoading(false)
  }

  async function openDoc(doc:Doc) {
    setSelected(doc)
    if(doc.file_path) {
      const { data } = await supabase.storage.from('lawyer-documents').createSignedUrl(doc.file_path, 3600)
      setPreviewUrl(data?.signedUrl || null)
    }
  }

  function getIcon(name:string) {
    const ext = name.split('.').pop()?.toLowerCase()
    if(ext==='pdf') return '📄'
    if(['doc','docx'].includes(ext||'')) return '📝'
    if(['jpg','jpeg','png','gif','webp'].includes(ext||'')) return '🖼️'
    if(['xls','xlsx'].includes(ext||'')) return '📊'
    return '📎'
  }

  function formatSize(bytes?:number) {
    if(!bytes) return ''
    if(bytes<1024) return `${bytes} B`
    if(bytes<1048576) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1048576).toFixed(1)} MB`
  }

  const filtered = docs.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category?.toLowerCase().includes(search.toLowerCase()))

  if(selected && previewUrl) {
    const ext = selected.name.split('.').pop()?.toLowerCase()
    const isPdf = ext==='pdf'
    const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext||'')
    return (
      <div className="space-y-4">
        <button onClick={()=>{setSelected(null);setPreviewUrl(null)}} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück zur Übersicht</button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy-800">{selected.name}</h2>
            <p className="text-xs text-navy-400">{selected.category||'Dokument'} · {new Date(selected.created_at).toLocaleDateString('de-DE')}</p>
          </div>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gold-400 text-white rounded-xl text-sm font-medium hover:bg-gold-500">📥 Herunterladen</a>
        </div>
        <Card className="p-0 overflow-hidden">
          {isPdf ? (
            <iframe src={previewUrl} className="w-full h-[80vh] border-0"/>
          ) : isImage ? (
            <div className="flex items-center justify-center p-8 bg-navy-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt={selected.name} className="max-w-full max-h-[70vh] rounded-xl shadow-lg"/>
            </div>
          ) : (
            <div className="p-12 text-center">
              <span className="text-5xl block mb-4">📎</span>
              <p className="text-navy-500">Vorschau für diesen Dateityp nicht verfügbar.</p>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-gold-500 text-sm mt-2 inline-block">Datei herunterladen →</a>
            </div>
          )}
        </Card>
      </div>
    )
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Dokument-Viewer</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Suchen..." className="px-4 py-2 rounded-xl border border-navy-200 text-sm w-64"/>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Dokumente gesamt</p><p className="text-2xl font-bold text-navy-900">{docs.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">PDFs</p><p className="text-2xl font-bold text-navy-900">{docs.filter(d=>d.name.endsWith('.pdf')).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Word-Docs</p><p className="text-2xl font-bold text-navy-900">{docs.filter(d=>d.name.match(/\.docx?$/)).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Bilder</p><p className="text-2xl font-bold text-navy-900">{docs.filter(d=>d.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length}</p></Card>
      </div>

      {filtered.length===0?<Card className="p-8 text-center"><span className="text-4xl block mb-3">📂</span><p className="text-navy-400">Keine Dokumente gefunden.</p></Card>:(
        <div className="space-y-2">{filtered.map(d=>(
          <Card key={d.id} className="p-4 cursor-pointer hover:border-gold-300 transition-colors" onClick={()=>openDoc(d)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getIcon(d.name)}</span>
                <div>
                  <p className="font-medium text-navy-800 text-sm">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-navy-400">{new Date(d.created_at).toLocaleDateString('de-DE')}</span>
                    {d.category && <span className="text-xs text-navy-400">· {d.category}</span>}
                    {d.size && <span className="text-xs text-navy-400">· {formatSize(d.size)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.status && <Badge variant={d.status==='final'?'success':'neutral'}>{d.status}</Badge>}
                <span className="text-navy-300">→</span>
              </div>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
