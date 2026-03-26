'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Command { label:string; icon:string; href:string; keywords:string[] }

const commands:Command[] = [
  {label:'Neue Akte anlegen', icon:'📁', href:'/anwalt/kanzlei/akten', keywords:['akte','case','neu','anlegen']},
  {label:'Neuen Mandanten anlegen', icon:'👤', href:'/anwalt/kanzlei/mandanten', keywords:['mandant','client','neu']},
  {label:'Timer starten', icon:'⏱️', href:'/anwalt/kanzlei/zeiterfassung', keywords:['timer','zeit','erfassung','start']},
  {label:'Rechnung erstellen', icon:'🧾', href:'/anwalt/kanzlei/rechnungen', keywords:['rechnung','invoice','erstellen']},
  {label:'Frist anlegen', icon:'📅', href:'/anwalt/kanzlei/fristen', keywords:['frist','deadline','termin']},
  {label:'RVG berechnen', icon:'⚖️', href:'/anwalt/kanzlei/rvg', keywords:['rvg','gebühr','berechnen','gegenstandswert']},
  {label:'Kollisionsprüfung', icon:'🔍', href:'/anwalt/kanzlei/kollision', keywords:['kollision','konflikt','prüfung','interessenkonflikt']},
  {label:'Recherche', icon:'📚', href:'/anwalt/kanzlei/recherche', keywords:['recherche','suche','urteil','juris']},
  {label:'KI-Assistent', icon:'🤖', href:'/anwalt/kanzlei/ki', keywords:['ki','ai','assistent','gpt']},
  {label:'beA-Postfach', icon:'✉️', href:'/anwalt/kanzlei/bea', keywords:['bea','postfach','nachricht']},
  {label:'DATEV-Export', icon:'📥', href:'/anwalt/kanzlei/datev', keywords:['datev','export','steuer']},
  {label:'Reporting', icon:'📊', href:'/anwalt/kanzlei/reporting', keywords:['reporting','statistik','umsatz']},
  {label:'Mahnwesen', icon:'📮', href:'/anwalt/kanzlei/mahnwesen', keywords:['mahnung','mahnwesen','forderung']},
  {label:'Vorlagen', icon:'📝', href:'/anwalt/kanzlei/vorlagen', keywords:['vorlage','template','schriftsatz']},
  {label:'Wissensmanagement', icon:'📖', href:'/anwalt/kanzlei/wissen', keywords:['wissen','knowledge','checkliste']},
  {label:'Kontakte', icon:'📇', href:'/anwalt/kanzlei/kontakte', keywords:['kontakt','adresse','gegner','gericht']},
  {label:'Mandatsannahme', icon:'📋', href:'/anwalt/kanzlei/mandatsannahme', keywords:['mandat','annahme','online']},
  {label:'Dashboard', icon:'🏠', href:'/anwalt/dashboard', keywords:['dashboard','home','start']},
  {label:'Profil', icon:'👤', href:'/anwalt/profil', keywords:['profil','einstellungen']},
  {label:'Abo', icon:'💳', href:'/anwalt/abo', keywords:['abo','subscription','upgrade']},
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(()=>{
    function onKey(e:KeyboardEvent) {
      if((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setOpen(o=>!o); setQuery('') }
      if(e.key==='Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(()=>{ if(open) setTimeout(()=>inputRef.current?.focus(), 50) }, [open])

  const filtered = commands.filter(c => {
    if(!query) return true
    const q = query.toLowerCase()
    return c.label.toLowerCase().includes(q) || c.keywords.some(k=>k.includes(q))
  })

  function go(href:string) { router.push(href); setOpen(false) }

  if(!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={()=>setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-navy-200 overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-100">
          <span className="text-navy-400">🔍</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Suchen oder Aktion starten..." className="flex-1 text-sm outline-none text-navy-800 placeholder:text-navy-400"
            onKeyDown={e=>{ if(e.key==='Enter' && filtered.length>0) go(filtered[0].href) }}/>
          <kbd className="text-xs bg-navy-100 text-navy-400 px-2 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length===0 ? (
            <p className="text-sm text-navy-400 text-center py-6">Keine Ergebnisse</p>
          ) : filtered.map(c=>(
            <button key={c.href} onClick={()=>go(c.href)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-navy-50 cursor-pointer transition-colors">
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm font-medium text-navy-800">{c.label}</span>
            </button>
          ))}
        </div>
        <div className="px-5 py-2 border-t border-navy-100 text-xs text-navy-400">⌘K zum Öffnen · Enter zum Navigieren · ESC zum Schließen</div>
      </div>
    </div>
  )
}
