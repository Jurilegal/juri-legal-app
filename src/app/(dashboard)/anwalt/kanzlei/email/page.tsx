'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Email { id:string; subject:string|null; from_address:string|null; to_address:string|null; body_preview:string|null; email_date:string|null; folder:string; is_read:boolean; case_id:string|null }
interface ImapConfig { host:string; port:string; user:string; password:string; tls:boolean }

export default function EmailPage() {
  const supabase = createClient()
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [folder, setFolder] = useState('inbox')
  const [search, setSearch] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<ImapConfig>({ host:'', port:'993', user:'', password:'', tls:true })
  const [selectedEmail, setSelectedEmail] = useState<Email|null>(null)
  const [cases, setCases] = useState<{id:string;title:string;reference_number:string|null}[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [compose, setCompose] = useState({ to:'', subject:'', body:'' })
  const [sending, setSending] = useState(false)

  useEffect(()=>{load()},[folder]) // eslint-disable-line
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('kanzlei_emails').select('*').eq('user_id',user.id).eq('folder',folder).order('email_date',{ascending:false}).limit(100)
    setEmails((data||[]) as Email[])
    const { data:c } = await supabase.from('cases').select('id,title,reference_number').eq('user_id',user.id).eq('status','active')
    setCases((c||[]) as typeof cases)
    // Load IMAP config from settings
    const { data:settings } = await supabase.from('kanzlei_settings').select('*').eq('user_id',user.id).single()
    if(settings?.imap_config) setConfig(settings.imap_config as ImapConfig)
    setLoading(false)
  }

  async function markRead(email:Email) {
    await supabase.from('kanzlei_emails').update({is_read:true}).eq('id',email.id)
    setSelectedEmail({...email, is_read:true})
    setEmails(prev=>prev.map(e=>e.id===email.id?{...e,is_read:true}:e))
  }

  async function linkToCase(emailId:string, caseId:string) {
    await supabase.from('kanzlei_emails').update({case_id:caseId}).eq('id',emailId)
    load()
  }

  async function saveImapConfig() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('kanzlei_settings').upsert({ user_id:user.id, imap_config:config }, {onConflict:'user_id'})
    setShowConfig(false)
    alert('IMAP-Konfiguration gespeichert. E-Mails werden beim nächsten Sync abgerufen.')
  }

  async function fetchEmails() {
    // Simulated fetch — in production this would call an API endpoint that connects via IMAP
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    alert('E-Mail-Abruf wird gestartet. Neue E-Mails erscheinen in Kürze.')
    // Demo: insert a sample email
    await supabase.from('kanzlei_emails').insert({
      user_id:user.id, subject:'Testmail — IMAP-Integration', from_address:config.user||'test@example.com',
      to_address:config.user, body_preview:'Dies ist eine Test-E-Mail zur Überprüfung der IMAP-Integration.',
      email_date:new Date().toISOString(), folder:'inbox', is_read:false
    })
    load()
  }

  async function sendEmail() {
    setSending(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    // Store in sent folder
    await supabase.from('kanzlei_emails').insert({
      user_id:user.id, subject:compose.subject, from_address:config.user||'kanzlei@example.com',
      to_address:compose.to, body_preview:compose.body.substring(0,500),
      email_date:new Date().toISOString(), folder:'sent', is_read:true
    })
    setCompose({to:'',subject:'',body:''}); setShowCompose(false); setSending(false)
    alert('E-Mail wurde gesendet (Demo-Modus). In Produktion wird SMTP verwendet.')
  }

  async function deleteEmail(id:string) {
    await supabase.from('kanzlei_emails').update({folder:'trash'}).eq('id',id)
    setSelectedEmail(null); load()
  }

  const filtered = emails.filter(e=>{
    if(!search) return true
    const s = search.toLowerCase()
    return (e.subject||'').toLowerCase().includes(s) || (e.from_address||'').toLowerCase().includes(s) || (e.body_preview||'').toLowerCase().includes(s)
  })
  const unreadCount = emails.filter(e=>!e.is_read).length

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-navy-800">E-Mail-Client</h2><p className="text-sm text-navy-400">IMAP-Integration für Ihre Kanzlei</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={()=>setShowConfig(!showConfig)}>⚙️ IMAP</Button>
          <Button variant="secondary" size="sm" onClick={fetchEmails}>🔄 Abrufen</Button>
          <Button variant="primary" size="sm" onClick={()=>setShowCompose(!showCompose)}>✉️ Neue E-Mail</Button>
        </div>
      </div>

      {showConfig && (
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-navy-800">IMAP-Konfiguration</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="IMAP-Server" value={config.host} onChange={e=>setConfig({...config,host:e.target.value})} placeholder="imap.gmail.com"/>
            <Input label="Port" value={config.port} onChange={e=>setConfig({...config,port:e.target.value})} placeholder="993"/>
            <Input label="Benutzername" value={config.user} onChange={e=>setConfig({...config,user:e.target.value})} placeholder="kanzlei@example.com"/>
            <Input label="Passwort" type="password" value={config.password} onChange={e=>setConfig({...config,password:e.target.value})} placeholder="App-Passwort"/>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-600">
            <input type="checkbox" checked={config.tls} onChange={e=>setConfig({...config,tls:e.target.checked})} className="rounded"/>
            TLS/SSL verwenden
          </label>
          <Button variant="primary" size="sm" onClick={saveImapConfig}>Speichern</Button>
        </Card>
      )}

      {showCompose && (
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-navy-800">Neue E-Mail</h3>
          <Input label="An" value={compose.to} onChange={e=>setCompose({...compose,to:e.target.value})} placeholder="empfaenger@example.com"/>
          <Input label="Betreff" value={compose.subject} onChange={e=>setCompose({...compose,subject:e.target.value})} placeholder="Betreff"/>
          <div><label className="block text-sm font-medium text-navy-700 mb-1">Nachricht</label>
            <textarea value={compose.body} onChange={e=>setCompose({...compose,body:e.target.value})} rows={6} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm resize-y"/>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={sendEmail} loading={sending} disabled={!compose.to||!compose.subject}>Senden</Button>
            <Button variant="secondary" size="sm" onClick={()=>setShowCompose(false)}>Abbrechen</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2 items-center">
        {['inbox','sent','trash'].map(f=>(
          <button key={f} onClick={()=>{setFolder(f);setSelectedEmail(null)}} className={`px-4 py-2 rounded-xl text-sm cursor-pointer ${folder===f?'bg-navy-800 text-white':'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'}`}>
            {f==='inbox'?`📥 Posteingang${unreadCount>0?` (${unreadCount})`:''}`:f==='sent'?'📤 Gesendet':'🗑️ Papierkorb'}
          </button>
        ))}
        <div className="flex-1"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Suchen..." className="px-4 py-2 rounded-xl border border-navy-200 text-sm w-64"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-1 max-h-[600px] overflow-y-auto">
          {filtered.length===0?<p className="text-sm text-navy-400 py-4">Keine E-Mails.</p>:
          filtered.map(e=>(
            <div key={e.id} onClick={()=>{setSelectedEmail(e);if(!e.is_read)markRead(e)}} className={`p-3 rounded-xl cursor-pointer border ${selectedEmail?.id===e.id?'border-gold-400 bg-gold-50':'border-navy-100 hover:bg-navy-50'} ${!e.is_read?'bg-blue-50 font-medium':''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-800 truncate">{e.from_address||'Unbekannt'}</span>
                <span className="text-xs text-navy-400">{e.email_date?new Date(e.email_date).toLocaleDateString('de-DE'):''}</span>
              </div>
              <p className="text-sm text-navy-700 truncate">{e.subject||'(Kein Betreff)'}</p>
              {e.case_id && <Badge variant="success">📁 Verknüpft</Badge>}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedEmail ? (
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-navy-800 text-lg">{selectedEmail.subject||'(Kein Betreff)'}</h3>
                  <p className="text-sm text-navy-500">Von: {selectedEmail.from_address}</p>
                  <p className="text-sm text-navy-500">An: {selectedEmail.to_address}</p>
                  <p className="text-xs text-navy-400">{selectedEmail.email_date?new Date(selectedEmail.email_date).toLocaleString('de-DE'):''}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>deleteEmail(selectedEmail.id)} className="text-red-400 hover:text-red-600 text-sm cursor-pointer">🗑️</button>
                  <button onClick={()=>{setShowCompose(true);setCompose({to:selectedEmail.from_address||'',subject:`Re: ${selectedEmail.subject||''}`,body:`\n\n--- Ursprüngliche Nachricht ---\n${selectedEmail.body_preview||''}`})}} className="text-navy-400 hover:text-navy-600 text-sm cursor-pointer">↩️ Antworten</button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-navy-700 whitespace-pre-wrap border-t border-navy-100 pt-4">
                {selectedEmail.body_preview||'Kein Inhalt'}
              </div>
              <div className="mt-4 pt-4 border-t border-navy-100">
                <label className="block text-xs font-medium text-navy-500 mb-1">Mit Akte verknüpfen:</label>
                <select value={selectedEmail.case_id||''} onChange={e=>linkToCase(selectedEmail.id,e.target.value)} className="px-3 py-1.5 rounded-xl border border-navy-200 text-sm">
                  <option value="">— Keine Akte —</option>
                  {cases.map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
                </select>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center"><p className="text-navy-400">Wählen Sie eine E-Mail aus.</p></Card>
          )}
        </div>
      </div>
    </div>
  )
}
