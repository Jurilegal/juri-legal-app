'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Message { role:'user'|'assistant'; content:string }

const TEMPLATES = [
  {label:'Zusammenfassung', prompt:'Fasse den folgenden juristischen Sachverhalt zusammen und identifiziere die Kernfragen:'},
  {label:'Argumentation', prompt:'Erstelle eine juristische Argumentation für folgenden Sachverhalt. Berücksichtige Rechtsprechung und Gesetzeslage:'},
  {label:'Schriftsatz-Entwurf', prompt:'Erstelle einen Entwurf für einen Schriftsatz basierend auf folgendem Sachverhalt:'},
  {label:'Risikoanalyse', prompt:'Analysiere die rechtlichen Risiken im folgenden Fall und gib eine Einschätzung der Erfolgsaussichten:'},
  {label:'Anonymisierung', prompt:'Anonymisiere den folgenden Text. Ersetze alle Personennamen durch Buchstaben (A, B, C...), Firmennamen durch Branchenbezeichnungen und Adressen durch allgemeine Ortsangaben:'},
]

export default function KIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const hasKey = false // OpenAI key not yet provided

  async function send() {
    if(!input.trim()) return
    const userMsg:Message = {role:'user', content:input}
    setMessages(prev=>[...prev, userMsg])
    setInput(''); setLoading(true)

    if(!hasKey) {
      // Simulate response when no API key
      await new Promise(r=>setTimeout(r,1000))
      setMessages(prev=>[...prev, {role:'assistant', content:'⚠️ Der KI-Assistent benötigt einen OpenAI API-Key. Sobald dieser hinterlegt ist, werden Ihre Anfragen von GPT-4 beantwortet.\n\nIhre Anfrage wurde empfangen:\n\n> '+userMsg.content.substring(0,200)+'...\n\nBitte hinterlegen Sie den API-Key in den Einstellungen unter OPENAI_API_KEY.'}])
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/anwalt/ki-assistant', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:[...messages, userMsg].map(m=>({role:m.role,content:m.content}))})
      })
      const data = await res.json()
      setMessages(prev=>[...prev, {role:'assistant', content:data.reply||'Fehler bei der Verarbeitung.'}])
    } catch { setMessages(prev=>[...prev, {role:'assistant', content:'Fehler bei der Verbindung zum KI-Service.'}]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold text-navy-800">KI-Assistent</h2>

      {!hasKey && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">⚠️ <strong>OpenAI API-Key fehlt.</strong> Der KI-Assistent funktioniert im Demo-Modus. Hinterlegen Sie <code>OPENAI_API_KEY</code> in den Umgebungsvariablen für volle Funktionalität.</p>
        </Card>
      )}

      {/* Templates */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map(t=>(
          <button key={t.label} onClick={()=>setInput(t.prompt+'\n\n')}
            className="px-3 py-1.5 bg-navy-50 text-navy-600 rounded-xl text-xs cursor-pointer hover:bg-navy-100">{t.label}</button>
        ))}
      </div>

      {/* Chat */}
      <Card className="p-0 overflow-hidden">
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length===0 && (
            <div className="text-center py-12">
              <span className="text-5xl block mb-3">🤖</span>
              <p className="text-navy-400">Stellen Sie eine juristische Frage oder nutzen Sie eine Vorlage oben.</p>
              <p className="text-xs text-navy-300 mt-2">Der KI-Assistent kann Sachverhalte zusammenfassen, Argumentationen erstellen, Schriftsätze entwerfen und Risiken analysieren.</p>
            </div>
          )}
          {messages.map((m,i)=>(
            <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role==='user'?'bg-navy-800 text-white':'bg-navy-50 text-navy-800'}`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-navy-50 p-4 rounded-2xl"><div className="flex gap-1"><span className="w-2 h-2 bg-navy-400 rounded-full animate-bounce"/><span className="w-2 h-2 bg-navy-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}/><span className="w-2 h-2 bg-navy-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}/></div></div></div>}
        </div>
        <div className="border-t border-navy-100 p-4 flex gap-3">
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            placeholder="Juristische Frage eingeben... (Enter zum Senden)" rows={2}
            className="flex-1 px-4 py-2 rounded-xl border border-navy-200 text-sm resize-none"/>
          <Button variant="primary" onClick={send} loading={loading} disabled={!input.trim()}>Senden</Button>
        </div>
      </Card>
    </div>
  )
}
