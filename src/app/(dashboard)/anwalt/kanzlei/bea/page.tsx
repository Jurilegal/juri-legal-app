'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface BeaMessage { id:string; direction:string; subject:string|null; sender:string|null; recipient:string|null; body:string|null; status:string; case_id:string|null; is_read:boolean; created_at:string; attachment_path?:string|null }
interface CaseRef { id:string; title:string; reference_number:string|null }

export default function BeAPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<BeaMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'inbox'|'outbox'|'drafts'>('inbox')
  const [selected, setSelected] = useState<BeaMessage|null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [cases, setCases] = useState<CaseRef[]>([])
  const [compose, setCompose] = useState({ recipient:'', subject:'', body:'', case_id:'', saveDraft:false })
  const [toast, setToast] = useState('')

  useEffect(()=>{load()},[tab]) // eslint-disable-line

  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    let query = supabase.from('bea_messages').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    if(tab==='inbox') query = query.eq('direction','inbound')
    else if(tab==='outbox') query = query.eq('direction','outbound').neq('status','draft')
    else query = query.eq('status','draft')
    const { data } = await query.limit(50)
    setMessages((data||[]) as BeaMessage[])
    const { data:c } = await supabase.from('cases').select('id,title,reference_number').eq('user_id',user.id)
    setCases((c||[]) as CaseRef[])
    setLoading(false)
  }

  async function selectMessage(m:BeaMessage) {
    setSelected(m); setShowCompose(false)
    if(!m.is_read && m.direction==='inbound') {
      await supabase.from('bea_messages').update({ is_read:true }).eq('id',m.id)
      setMessages(prev=>prev.map(msg=>msg.id===m.id?{...msg,is_read:true}:msg))
    }
  }

  async function sendMessage() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user||!compose.recipient||!compose.subject) return
    await supabase.from('bea_messages').insert({
      user_id:user.id, direction:'outbound', subject:compose.subject, sender:'Eigenes beA',
      recipient:compose.recipient, body:compose.body, status:compose.saveDraft?'draft':'sent',
      case_id:compose.case_id||null, is_read:true
    })
    setToast(compose.saveDraft?'Entwurf gespeichert':'Nachricht gesendet'); setTimeout(()=>setToast(''),3000)
    setCompose({ recipient:'', subject:'', body:'', case_id:'', saveDraft:false }); setShowCompose(false); load()
  }

  async function deleteMessage(id:string) {
    await supabase.from('bea_messages').delete().eq('id',id)
    setSelected(null); setToast('Gelöscht'); setTimeout(()=>setToast(''),2000); load()
  }

  const unreadCount = messages.filter(m=>!m.is_read&&m.direction==='inbound').length
  const tabCounts = { inbox:messages.length, outbox:0, drafts:0 }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg bg-green-500 text-white">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy-800">📨 beA-Postfach</h2>
          <p className="text-sm text-navy-400">Besonderes elektronisches Anwaltspostfach</p>
        </div>
        <Button variant="primary" size="sm" onClick={()=>{setShowCompose(true);setSelected(null)}}>✉️ Neue Nachricht</Button>
      </div>

      <div className="flex gap-2 border-b border-navy-100 pb-2">
        {(['inbox','outbox','drafts'] as const).map(t=>(
          <button key={t} onClick={()=>{setTab(t);setSelected(null)}} className={`px-4 py-2 rounded-t-xl text-sm cursor-pointer ${tab===t?'bg-navy-800 text-white font-medium':'text-navy-500 hover:bg-navy-50'}`}>
            {t==='inbox'?`📥 Posteingang${unreadCount?' ('+unreadCount+')':''}`:t==='outbox'?'📤 Gesendet':'📝 Entwürfe'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {messages.length===0 ? <Card className="p-6 text-center"><p className="text-sm text-navy-400">Keine Nachrichten</p></Card> :
          messages.map(m=>(
            <button key={m.id} onClick={()=>selectMessage(m)} className={`w-full text-left p-3 rounded-xl cursor-pointer transition ${selected?.id===m.id?'bg-gold-50 border-gold-300 border':'bg-white border border-navy-100 hover:border-gold-200'} ${!m.is_read?'font-semibold':''}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-navy-800 truncate">{m.subject||'(Kein Betreff)'}</p>
                {!m.is_read && <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0"/>}
              </div>
              <p className="text-xs text-navy-400 truncate">{m.direction==='inbound'?m.sender:m.recipient}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-navy-400">{new Date(m.created_at).toLocaleDateString('de-DE')}</span>
                <Badge variant={m.status==='sent'?'success':m.status==='draft'?'warning':'neutral'}>{m.status}</Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Detail / Compose */}
        <div className="lg:col-span-2">
          {showCompose ? (
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-navy-800">Neue beA-Nachricht</h3>
              <input value={compose.recipient} onChange={e=>setCompose(p=>({...p,recipient:e.target.value}))} placeholder="Empfänger (Gericht, Anwalt, Behörde)" className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm"/>
              <input value={compose.subject} onChange={e=>setCompose(p=>({...p,subject:e.target.value}))} placeholder="Betreff" className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm"/>
              <select value={compose.case_id} onChange={e=>setCompose(p=>({...p,case_id:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-xs">
                <option value="">📁 Akte zuordnen (optional)...</option>
                {cases.map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
              </select>
              <textarea value={compose.body} onChange={e=>setCompose(p=>({...p,body:e.target.value}))} rows={10} placeholder="Nachricht..." className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm resize-y"/>
              <p className="text-[10px] text-navy-400">⚠️ Qualifizierte elektronische Signatur (qeS) wird in der Produktionsversion über die beA-Schnittstelle realisiert.</p>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={()=>{compose.saveDraft=false;sendMessage()}}>📤 Senden</Button>
                <Button variant="secondary" size="sm" onClick={()=>{compose.saveDraft=true;sendMessage()}}>💾 Entwurf</Button>
                <Button variant="secondary" size="sm" onClick={()=>setShowCompose(false)}>Abbrechen</Button>
              </div>
            </Card>
          ) : selected ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-navy-800">{selected.subject||'(Kein Betreff)'}</h3>
                <div className="flex gap-2">
                  <Badge variant={selected.direction==='inbound'?'info':'success'}>{selected.direction==='inbound'?'Eingang':'Ausgang'}</Badge>
                  <button onClick={()=>deleteMessage(selected.id)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer">🗑️</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-navy-500">
                <p><strong>Von:</strong> {selected.sender||'—'}</p>
                <p><strong>An:</strong> {selected.recipient||'—'}</p>
                <p><strong>Datum:</strong> {new Date(selected.created_at).toLocaleString('de-DE')}</p>
                <p><strong>Status:</strong> {selected.status}</p>
              </div>
              {selected.case_id && <p className="text-xs text-gold-600">📁 Verknüpft mit Akte</p>}
              <div className="border-t border-navy-100 pt-3">
                <pre className="text-sm text-navy-700 whitespace-pre-wrap font-sans">{selected.body||'(Kein Inhalt)'}</pre>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={()=>{setShowCompose(true);setCompose({recipient:selected.sender||'',subject:'Re: '+(selected.subject||''),body:'\n\n--- Ursprüngliche Nachricht ---\n'+selected.body,case_id:selected.case_id||'',saveDraft:false})}}>↩️ Antworten</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center flex items-center justify-center h-48">
              <div><p className="text-4xl mb-2">📨</p><p className="text-navy-400">Nachricht auswählen oder neue verfassen</p></div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
