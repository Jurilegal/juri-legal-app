'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface SearchResult { type:string; id:string; title:string; subtitle:string; match:string; url:string }

export default function SuchePage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filter, setFilter] = useState('all')

  async function search() {
    if(!query.trim()) return
    setSearching(true); setSearched(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) { setSearching(false); return }
    const q = query.toLowerCase()
    const all:SearchResult[] = []

    // Search cases
    const { data:cases } = await supabase.from('cases').select('id,title,reference_number,description,opponent_name,status').eq('user_id',user.id)
    ;(cases||[]).forEach(c=>{
      const searchable = `${c.title} ${c.reference_number||''} ${c.description||''} ${c.opponent_name||''}`.toLowerCase()
      if(searchable.includes(q)) all.push({type:'akte',id:c.id,title:c.title,subtitle:`Az: ${c.reference_number||'—'} · ${c.status}`,match:c.description?.substring(0,100)||'',url:`/anwalt/kanzlei/akten/${c.id}`})
    })

    // Search contacts
    const { data:contacts } = await supabase.from('kanzlei_contacts').select('id,first_name,last_name,company,email,phone,contact_type').eq('user_id',user.id)
    ;(contacts||[]).forEach(c=>{
      const searchable = `${c.first_name||''} ${c.last_name||''} ${c.company||''} ${c.email||''} ${c.phone||''}`.toLowerCase()
      if(searchable.includes(q)) all.push({type:'kontakt',id:c.id,title:`${c.first_name||''} ${c.last_name||''}`.trim()||c.company||'',subtitle:c.contact_type||'Kontakt',match:`${c.email||''} ${c.phone||''}`.trim(),url:'/anwalt/kanzlei/kontakte'})
    })

    // Search notes
    const { data:notes } = await supabase.from('case_notes').select('id,content,note_type,case_id,created_at').eq('user_id',user.id)
    ;(notes||[]).forEach(n=>{
      if(n.content?.toLowerCase().includes(q)) all.push({type:'notiz',id:n.id,title:`${n.note_type} — ${new Date(n.created_at).toLocaleDateString('de-DE')}`,subtitle:'Aktennotiz',match:n.content.substring(0,150),url:`/anwalt/kanzlei/akten/${n.case_id}`})
    })

    // Search documents
    const { data:docs } = await supabase.from('case_documents').select('id,name,original_filename,case_id').eq('user_id',user.id)
    ;(docs||[]).forEach(d=>{
      const searchable = `${d.name||''} ${d.original_filename||''}`.toLowerCase()
      if(searchable.includes(q)) all.push({type:'dokument',id:d.id,title:d.name||d.original_filename||'Dokument',subtitle:'Datei',match:'',url:d.case_id?`/anwalt/kanzlei/akten/${d.case_id}`:'/anwalt/dokumente'})
    })

    // Search invoices
    const { data:invoices } = await supabase.from('kanzlei_invoices').select('id,invoice_number,status,total_amount').eq('user_id',user.id)
    ;(invoices||[]).forEach(i=>{
      if((i.invoice_number||'').toLowerCase().includes(q)) all.push({type:'rechnung',id:i.id,title:i.invoice_number||'Rechnung',subtitle:`${i.status} · ${(i.total_amount||0).toFixed(2)} €`,match:'',url:'/anwalt/kanzlei/rechnungen'})
    })

    // Search deadlines
    const { data:deadlines } = await supabase.from('deadlines').select('id,title,due_date,status').eq('user_id',user.id)
    ;(deadlines||[]).forEach(d=>{
      if(d.title?.toLowerCase().includes(q)) all.push({type:'frist',id:d.id,title:d.title,subtitle:`Fällig: ${new Date(d.due_date).toLocaleDateString('de-DE')}`,match:'',url:'/anwalt/kanzlei/fristen'})
    })

    // Search knowledge base
    const { data:kb } = await supabase.from('knowledge_base').select('id,title,content').eq('user_id',user.id)
    ;(kb||[]).forEach(k=>{
      const searchable = `${k.title||''} ${k.content||''}`.toLowerCase()
      if(searchable.includes(q)) all.push({type:'wissen',id:k.id,title:k.title||'Eintrag',subtitle:'Wissensmanagement',match:(k.content||'').substring(0,150),url:'/anwalt/kanzlei/wissen'})
    })

    // Search text snippets
    const { data:snippets } = await supabase.from('text_snippets').select('id,title,content,shortcut').eq('user_id',user.id)
    ;(snippets||[]).forEach(s=>{
      const searchable = `${s.title||''} ${s.content||''} ${s.shortcut||''}`.toLowerCase()
      if(searchable.includes(q)) all.push({type:'textbaustein',id:s.id,title:s.title||'Baustein',subtitle:s.shortcut?`/${s.shortcut}`:'',match:(s.content||'').substring(0,100),url:'/anwalt/kanzlei/textbausteine'})
    })

    // Search emails
    const { data:emails } = await supabase.from('kanzlei_emails').select('id,subject,from_address,body_preview').eq('user_id',user.id)
    ;(emails||[]).forEach(e=>{
      const searchable = `${e.subject||''} ${e.from_address||''} ${e.body_preview||''}`.toLowerCase()
      if(searchable.includes(q)) all.push({type:'email',id:e.id,title:e.subject||'(Kein Betreff)',subtitle:e.from_address||'',match:(e.body_preview||'').substring(0,100),url:'/anwalt/kanzlei/email'})
    })

    setResults(all)
    setSearching(false)
  }

  const typeIcons:Record<string,string> = {akte:'📁',kontakt:'👤',notiz:'📝',dokument:'📄',rechnung:'🧾',frist:'⏰',wissen:'📚',textbaustein:'✂️',email:'✉️'}
  const typeLabels:Record<string,string> = {akte:'Akte',kontakt:'Kontakt',notiz:'Notiz',dokument:'Dokument',rechnung:'Rechnung',frist:'Frist',wissen:'Wissen',textbaustein:'Textbaustein',email:'E-Mail'}
  const filtered = filter==='all'?results:results.filter(r=>r.type===filter)
  const types = [...new Set(results.map(r=>r.type))]

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-navy-800">Volltextsuche</h2><p className="text-sm text-navy-400">Durchsuchen Sie alle Akten, Kontakte, Dokumente und mehr</p></div>

      <div className="flex gap-2">
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="🔍 Suchbegriff eingeben..." className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400"/>
        <button onClick={search} disabled={searching||!query.trim()} className="px-6 py-3 bg-navy-800 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-navy-700 disabled:opacity-50">
          {searching?'Suche...':'Suchen'}
        </button>
      </div>

      {searched && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-navy-500">{results.length} Ergebnisse</span>
            <button onClick={()=>setFilter('all')} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${filter==='all'?'bg-navy-800 text-white':'bg-navy-100 text-navy-600'}`}>Alle</button>
            {types.map(t=>(
              <button key={t} onClick={()=>setFilter(t)} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${filter===t?'bg-navy-800 text-white':'bg-navy-100 text-navy-600'}`}>
                {typeIcons[t]} {typeLabels[t]||t} ({results.filter(r=>r.type===t).length})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Keine Ergebnisse für &ldquo;{query}&rdquo;</p></Card>:
            filtered.map(r=>(
              <Link key={`${r.type}-${r.id}`} href={r.url}>
                <Card className="p-4 hover:border-gold-300 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{typeIcons[r.type]||'📋'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-navy-800 truncate">{r.title}</h3>
                        <Badge variant="neutral">{typeLabels[r.type]||r.type}</Badge>
                      </div>
                      {r.subtitle&&<p className="text-xs text-navy-400">{r.subtitle}</p>}
                      {r.match&&<p className="text-sm text-navy-500 mt-1 line-clamp-2">{r.match}</p>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {!searched && (
        <Card className="p-8 text-center space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-navy-500">Geben Sie einen Suchbegriff ein und durchsuchen Sie:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(typeLabels).map(([k,v])=>(
              <span key={k} className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-xs">{typeIcons[k]} {v}</span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
