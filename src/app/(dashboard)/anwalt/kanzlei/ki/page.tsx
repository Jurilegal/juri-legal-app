'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Message { id?:string; role:string; content:string; created_at?:string }
interface Case { id:string; title:string; reference_number:string|null }

const VORLAGEN = [
  { title:'Schriftsatz entwerfen', prompt:'Entwirf einen Schriftsatz für folgenden Sachverhalt:' },
  { title:'Fristenberechnung', prompt:'Berechne die relevanten Fristen für folgenden Fall nach ZPO:' },
  { title:'Vertragsprüfung', prompt:'Prüfe folgenden Vertrag auf rechtliche Risiken:' },
  { title:'Widerspruch formulieren', prompt:'Formuliere einen Widerspruch gegen folgenden Bescheid:' },
  { title:'Klageentwurf', prompt:'Erstelle einen Klageentwurf für:' },
  { title:'Mandantenbrief', prompt:'Verfasse ein Mandantenanschreiben zu folgendem Sachstand:' },
  { title:'Mahnung entwerfen', prompt:'Erstelle eine anwaltliche Mahnung für:' },
  { title:'Vergleichsvorschlag', prompt:'Erstelle einen Vergleichsvorschlag für:' },
  { title:'Gutachten-Zusammenfassung', prompt:'Fasse folgendes Gutachten zusammen und bewerte die Kernaussagen:' },
  { title:'Recherche-Zusammenfassung', prompt:'Recherchiere und fasse zusammen zum Thema:' },
]

const OFFLINE_RESPONSES: Record<string,string> = {
  'frist': '**Fristenberechnung (ZPO §222)**\n\nWichtige Fristen im Zivilprozess:\n- **Klagefrist:** Variiert je nach Klagetyp\n- **Berufungsfrist:** 1 Monat ab Zustellung (§ 517 ZPO)\n- **Revisionsfrist:** 1 Monat ab Zustellung (§ 548 ZPO)\n- **Einspruchsfrist Versäumnisurteil:** 2 Wochen (§ 339 ZPO)\n- **Widerspruchsfrist Mahnbescheid:** 2 Wochen (§ 694 ZPO)\n\n⚠️ Fristende auf Samstag/Sonntag/Feiertag → nächster Werktag (§ 222 Abs. 2 ZPO)',
  'rvg': '**RVG-Gebührenberechnung**\n\nGebührenarten nach RVG:\n- **Geschäftsgebühr (VV 2300):** 0,5-2,5 (Regelsatz 1,3)\n- **Verfahrensgebühr (VV 3100):** 1,3\n- **Terminsgebühr (VV 3104):** 1,2\n- **Einigungsgebühr (VV 1000):** 1,0-1,5\n\nBerechnung: Streitwert → Gebührentabelle § 13 RVG → Gebühr × Faktor\n\n💡 Nutzen Sie unseren RVG-Rechner unter Kanzlei → RVG-Rechner',
  'vollmacht': '**Muster: Prozessvollmacht**\n\n---\n\nVOLLMACHT\n\nIch/Wir, [Mandant], wohnhaft in [Adresse],\n\nbevollmächtige(n) hiermit\n\nRechtsanwalt/Rechtsanwältin [Name], [Kanzlei], [Adresse],\n\nmich/uns in der Rechtssache\n\n[Mandant] ./. [Gegner]\n\nvor allen Gerichten und Behörden zu vertreten.\n\nDie Vollmacht umfasst die Befugnis zur Prozessführung einschließlich aller Nebenverfahren, Zustellungen entgegenzunehmen, Rechtsmittel einzulegen und zurückzunehmen, Vergleiche zu schließen und Geld in Empfang zu nehmen.\n\n[Ort], den [Datum]\n\n_____________________\n[Unterschrift Mandant]',
  'kündigung': '**Prüfschema: Kündigung Arbeitsrecht**\n\n1. **Kündigungserklärung**\n   - Schriftform (§ 623 BGB) ✓/✗\n   - Zugang beim Arbeitnehmer ✓/✗\n\n2. **Kündigungsschutz anwendbar?**\n   - Betrieb > 10 AN (§ 23 KSchG)\n   - Wartezeit 6 Monate (§ 1 KSchG)\n\n3. **Kündigungsgrund**\n   - Personenbedingt / Verhaltensbedingt / Betriebsbedingt\n   - Abmahnung bei verhaltensbedingter Kündigung?\n\n4. **Kündigungsfrist**\n   - § 622 BGB / Vertrag / Tarifvertrag\n\n5. **Sonderkündigungsschutz**\n   - Schwangerschaft (§ 17 MuSchG)\n   - Schwerbehinderte (§ 168 SGB IX)\n   - Betriebsrat (§ 15 KSchG)\n\n6. **Klagefrist: 3 Wochen!** (§ 4 KSchG)',
}

export default function KIAssistentPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState('')
  const [showVorlagen, setShowVorlagen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{loadHistory()}, []) // eslint-disable-line
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'})}, [messages])

  async function loadHistory() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data:history } = await supabase.from('ki_chat_history').select('*').eq('user_id',user.id).order('created_at',{ascending:true}).limit(50)
    if(history?.length) setMessages(history as Message[])
    const { data:c } = await supabase.from('cases').select('id,title,reference_number').eq('user_id',user.id).eq('status','active').limit(20)
    setCases((c||[]) as Case[])
    setLoadingHistory(false)
  }

  async function sendMessage(text?:string) {
    const msg = text || input.trim()
    if(!msg) return
    setInput('')
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return

    const userMsg:Message = { role:'user', content:msg }
    setMessages(prev=>[...prev, userMsg])
    await supabase.from('ki_chat_history').insert({ user_id:user.id, role:'user', content:msg })

    setLoading(true)

    // Build context
    let caseContext = ''
    if(selectedCase) {
      const c = cases.find(ca=>ca.id===selectedCase)
      if(c) caseContext = `\n[Aktenkontext: ${c.reference_number||''} — ${c.title}]`
    }

    let aiResponse = ''

    // Try API first
    try {
      const res = await fetch('/api/anwalt/ki-assistant', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ message: msg + caseContext, history: messages.slice(-10) })
      })
      if(res.ok) {
        const data = await res.json()
        aiResponse = data.response || data.content || ''
      }
    } catch { /* API not available */ }

    // Fallback: offline smart responses
    if(!aiResponse) {
      const lower = msg.toLowerCase()
      if(lower.includes('frist')) aiResponse = OFFLINE_RESPONSES['frist']
      else if(lower.includes('rvg') || lower.includes('gebühr')) aiResponse = OFFLINE_RESPONSES['rvg']
      else if(lower.includes('vollmacht')) aiResponse = OFFLINE_RESPONSES['vollmacht']
      else if(lower.includes('kündig')) aiResponse = OFFLINE_RESPONSES['kündigung']
      else aiResponse = `Ich habe Ihre Anfrage erhalten:\n\n> ${msg}\n\n**Hinweis:** Der KI-Assistent arbeitet derzeit im Offline-Modus. Für vollständige KI-Antworten wird ein API-Key benötigt (Einstellungen → KI-Konfiguration).\n\n**Hilfreiche Ressourcen:**\n- 📊 RVG-Rechner für Gebührenberechnungen\n- 📅 Fristenkalender für Terminübersicht\n- 📚 Wissensmanagement für eigene Recherche-Ergebnisse\n- ✂️ Textbausteine für häufige Formulierungen`
    }

    const assistantMsg:Message = { role:'assistant', content:aiResponse }
    setMessages(prev=>[...prev, assistantMsg])
    await supabase.from('ki_chat_history').insert({ user_id:user.id, role:'assistant', content:aiResponse })
    setLoading(false)
  }

  async function saveToCase(content:string) {
    if(!selectedCase) return
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('case_notes').insert({ case_id:selectedCase, user_id:user.id, content:'[KI-Assistent]\n'+content, note_type:'vermerk' })
  }

  async function clearHistory() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('ki_chat_history').delete().eq('user_id',user.id)
    setMessages([])
  }

  function copyText(text:string) {
    navigator.clipboard.writeText(text)
  }

  function renderMarkdown(text:string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-navy-800 mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-navy-800 mt-4 mb-2">$1</h2>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gold-400 pl-3 text-navy-500 italic my-2">$1</blockquote>')
      .replace(/\n/g, '<br/>')
      .replace(/---/g, '<hr class="my-3 border-navy-100"/>')
  }

  if(loadingHistory) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800">🤖 KI-Rechtsassistent</h2>
          <p className="text-sm text-navy-400">Ihr intelligenter Assistent für Rechtsfragen, Schriftsätze und Recherche</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedCase} onChange={e=>setSelectedCase(e.target.value)} className="px-3 py-1.5 rounded-xl border border-navy-200 text-xs">
            <option value="">📁 Keine Akte</option>
            {cases.map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={()=>setShowVorlagen(!showVorlagen)}>📋 Vorlagen</Button>
          <button onClick={clearHistory} className="text-xs text-navy-400 hover:text-red-500 cursor-pointer px-2">🗑️ Verlauf</button>
        </div>
      </div>

      {/* Vorlagen */}
      {showVorlagen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {VORLAGEN.map(v=>(
            <button key={v.title} onClick={()=>{setInput(v.prompt);setShowVorlagen(false)}} className="p-2 text-left bg-gold-50 hover:bg-gold-100 rounded-xl text-xs text-navy-700 cursor-pointer border border-gold-200">
              {v.title}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length===0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">⚖️</p>
            <p className="text-navy-500">Stellen Sie Ihre Rechtsfrage oder wählen Sie eine Vorlage.</p>
            <p className="text-xs text-navy-400 mt-2">Tipp: Wählen Sie eine Akte für kontextbezogene Antworten.</p>
          </div>
        )}
        {messages.map((m,i)=>(
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role==='user'?'bg-navy-800 text-white':'bg-white border border-navy-100'}`}>
              {m.role==='assistant' ? (
                <div>
                  <div className="text-sm text-navy-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html:renderMarkdown(m.content)}}/>
                  <div className="flex gap-2 mt-2 pt-2 border-t border-navy-50">
                    <button onClick={()=>copyText(m.content)} className="text-[10px] text-navy-400 hover:text-navy-600 cursor-pointer">📋 Kopieren</button>
                    {selectedCase && <button onClick={()=>saveToCase(m.content)} className="text-[10px] text-gold-500 hover:text-gold-700 cursor-pointer">📁 In Akte speichern</button>}
                  </div>
                </div>
              ) : (
                <p className="text-sm">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-navy-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1"><div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce"/><div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}/><div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}/></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="Rechtsfrage eingeben... (Enter = Senden, Shift+Enter = Neue Zeile)" rows={2} className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-sm resize-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"/>
        <Button variant="primary" onClick={()=>sendMessage()} disabled={loading||!input.trim()} loading={loading}>
          Senden
        </Button>
      </div>

      {selectedCase && <p className="text-[10px] text-navy-400 mt-1">📁 Aktenkontext: {cases.find(c=>c.id===selectedCase)?.title}</p>}
    </div>
  )
}
