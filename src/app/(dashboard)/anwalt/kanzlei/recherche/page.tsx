'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface SearchResult { type:string; title:string; content:string; source:string; url?:string; case_id?:string }
interface RecentSearch { id:string; query:string; created_at:string }

const GESETZE_LINKS: Record<string,string> = {
  'bgb':'https://www.gesetze-im-internet.de/bgb/', 'zpo':'https://www.gesetze-im-internet.de/zpo/',
  'stgb':'https://www.gesetze-im-internet.de/stgb/', 'stpo':'https://www.gesetze-im-internet.de/stpo/',
  'hgb':'https://www.gesetze-im-internet.de/hgb/', 'gmbhg':'https://www.gesetze-im-internet.de/gmbhg/',
  'inso':'https://www.gesetze-im-internet.de/inso/', 'rvg':'https://www.gesetze-im-internet.de/rvg/',
  'brao':'https://www.gesetze-im-internet.de/brao/', 'kschg':'https://www.gesetze-im-internet.de/kschg/',
  'famfg':'https://www.gesetze-im-internet.de/famfg/', 'arbgg':'https://www.gesetze-im-internet.de/arbgg/',
  'gkg':'https://www.gesetze-im-internet.de/gkg_2004/', 'vwgo':'https://www.gesetze-im-internet.de/vwgo/',
  'sgb':'https://www.gesetze-im-internet.de/sgb_1/', 'gg':'https://www.gesetze-im-internet.de/gg/',
}

export default function RecherchePage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filter, setFilter] = useState('all')
  const [cases, setCases] = useState<{id:string;title:string}[]>([])
  const [toast, setToast] = useState('')

  useEffect(()=>{loadRecent()},[]) // eslint-disable-line

  async function loadRecent() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('legal_research_queries').select('id,query,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10)
    setRecentSearches((data||[]) as RecentSearch[])
    const { data:c } = await supabase.from('cases').select('id,title').eq('user_id',user.id).eq('status','active')
    setCases((c||[]) as typeof cases)
  }

  async function search(searchQuery?:string) {
    const q = searchQuery || query.trim()
    if(!q) return
    setSearching(true); setSearched(true); setQuery(q)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) { setSearching(false); return }
    const lower = q.toLowerCase()
    const all:SearchResult[] = []

    // Save search query
    await supabase.from('legal_research_queries').insert({ user_id:user.id, query:q })

    // Search knowledge base
    const { data:kb } = await supabase.from('knowledge_base').select('*').eq('user_id',user.id)
    for(const entry of (kb||[])) {
      if(`${entry.title} ${entry.content}`.toLowerCase().includes(lower)) {
        all.push({ type:'wissen', title:entry.title||'KB-Eintrag', content:(entry.content||'').substring(0,200), source:'Wissensmanagement' })
      }
    }

    // Search case notes
    const { data:notes } = await supabase.from('case_notes').select('*,cases(title)').eq('user_id',user.id)
    for(const note of (notes||[])) {
      if((note.content||'').toLowerCase().includes(lower)) {
        const caseTitle = (note.cases as {title:string}|null)?.title || ''
        all.push({ type:'notiz', title:`${note.note_type} — ${caseTitle}`, content:(note.content||'').substring(0,200), source:'Aktennotiz', case_id:note.case_id })
      }
    }

    // Search text snippets
    const { data:snippets } = await supabase.from('text_snippets').select('*').eq('user_id',user.id)
    for(const s of (snippets||[])) {
      if(`${s.title} ${s.content} ${s.shortcut}`.toLowerCase().includes(lower)) {
        all.push({ type:'textbaustein', title:s.title||'Baustein', content:(s.content||'').substring(0,200), source:'Textbaustein' })
      }
    }

    // Parse law references (§ 823 BGB → link)
    const lawMatch = q.match(/§\s*(\d+[a-z]?)\s+(abs\.\s*\d+\s+)?(.*)/i) || q.match(/(bgb|zpo|stgb|stpo|hgb|rvg|brao|kschg|inso|gmbhg|famfg|arbgg|gkg|gg)/i)
    if(lawMatch) {
      const lawText = q.toLowerCase()
      for(const [code,url] of Object.entries(GESETZE_LINKS)) {
        if(lawText.includes(code)) {
          all.push({ type:'gesetz', title:`${code.toUpperCase()} — gesetze-im-internet.de`, content:`Gesetzestext ${code.toUpperCase()} auf gesetze-im-internet.de einsehen`, source:'Gesetzessammlung', url })
        }
      }
    }

    // Always add gesetze-im-internet.de search
    all.push({ type:'gesetz', title:`Gesetze-Suche: "${q}"`, content:'Suche auf gesetze-im-internet.de', source:'gesetze-im-internet.de', url:`https://www.gesetze-im-internet.de/Teilliste_${q.charAt(0).toUpperCase()}.html` })

    setResults(all)
    setSearching(false)
    loadRecent()
  }

  async function addToCase(result:SearchResult, caseId:string) {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('case_notes').insert({ case_id:caseId, user_id:user.id, content:`[Recherche]\n${result.title}\n\n${result.content}`, note_type:'vermerk' })
    setToast('Zur Akte hinzugefügt'); setTimeout(()=>setToast(''),3000)
  }

  const typeIcons:Record<string,string> = { wissen:'📚', notiz:'📝', textbaustein:'✂️', gesetz:'⚖️' }
  const filtered = filter==='all'?results:results.filter(r=>r.type===filter)

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg bg-green-500 text-white">{toast}</div>}

      <div><h2 className="text-xl font-bold text-navy-800">Rechtsrecherche</h2><p className="text-sm text-navy-400">Durchsuchen Sie Ihre Wissensbasis, Aktennotizen und Gesetze</p></div>

      <div className="flex gap-2">
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="🔍 Suchbegriff, Gesetzesnorm (z.B. § 823 BGB) ..." className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-sm focus:ring-2 focus:ring-gold-400"/>
        <Button variant="primary" onClick={()=>search()} disabled={searching||!query.trim()} loading={searching}>Suchen</Button>
      </div>

      {/* Recent searches */}
      {!searched && recentSearches.length>0 && (
        <Card className="p-4">
          <p className="text-xs font-medium text-navy-500 mb-2">Letzte Suchanfragen:</p>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map(r=>(
              <button key={r.id} onClick={()=>search(r.query)} className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-xs cursor-pointer hover:bg-navy-100">{r.query}</button>
            ))}
          </div>
        </Card>
      )}

      {searched && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-navy-500">{results.length} Ergebnisse</span>
            {['all','wissen','notiz','textbaustein','gesetz'].map(t=>(
              <button key={t} onClick={()=>setFilter(t)} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${filter===t?'bg-navy-800 text-white':'bg-navy-100 text-navy-600'}`}>
                {t==='all'?'Alle':`${typeIcons[t]||''} ${t.charAt(0).toUpperCase()+t.slice(1)}`} {t!=='all'?`(${results.filter(r=>r.type===t).length})`:''}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.length===0 ? <Card className="p-8 text-center"><p className="text-navy-400">Keine Ergebnisse für &ldquo;{query}&rdquo;</p></Card> :
            filtered.map((r,i)=>(
              <Card key={i} className="p-4 hover:border-gold-300 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeIcons[r.type]||'📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gold-600 hover:underline">{r.title}</a> : <h3 className="font-medium text-navy-800">{r.title}</h3>}
                      <Badge variant="neutral">{r.source}</Badge>
                    </div>
                    <p className="text-sm text-navy-500 mt-1">{r.content}</p>
                    <div className="flex gap-2 mt-2">
                      {cases.length>0 && (
                        <select onChange={e=>{if(e.target.value)addToCase(r,e.target.value);e.target.value=''}} className="px-2 py-1 rounded border border-navy-200 text-xs" defaultValue="">
                          <option value="">📁 Zur Akte hinzufügen...</option>
                          {cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      )}
                      <button onClick={()=>{navigator.clipboard.writeText(r.content);setToast('Kopiert');setTimeout(()=>setToast(''),2000)}} className="text-xs text-navy-400 hover:text-navy-600 cursor-pointer">📋 Kopieren</button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {!searched && (
        <Card className="p-8 text-center space-y-3">
          <p className="text-4xl">⚖️</p>
          <p className="text-navy-500">Durchsuchen Sie:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-xs">📚 Wissensmanagement</span>
            <span className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-xs">📝 Aktennotizen</span>
            <span className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-xs">✂️ Textbausteine</span>
            <span className="px-3 py-1 bg-navy-50 text-navy-600 rounded-full text-xs">⚖️ Gesetze (gesetze-im-internet.de)</span>
          </div>
          <p className="text-xs text-navy-400">Tipp: Geben Sie eine Gesetzesnorm ein (z.B. &quot;§ 823 BGB&quot;) für direkte Links</p>
        </Card>
      )}
    </div>
  )
}
