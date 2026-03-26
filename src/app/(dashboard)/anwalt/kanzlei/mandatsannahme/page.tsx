'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Intake { id:string; token:string; is_active:boolean; submissions:Array<{name:string;email:string;phone:string;subject:string;description:string;date:string}>; created_at:string }

export default function MandatsannahmePage() {
  const supabase = createClient()
  const [intake, setIntake] = useState<Intake|null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('mandate_intake').select('*').eq('user_id',user.id).single()
    setIntake(data as Intake|null); setLoading(false)
  }
  async function create() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    await supabase.from('mandate_intake').insert({ user_id:user.id })
    load()
  }
  async function toggle() {
    if(!intake) return
    await supabase.from('mandate_intake').update({is_active:!intake.is_active}).eq('id',intake.id)
    load()
  }
  function copyLink() {
    if(!intake) return
    navigator.clipboard.writeText(`${window.location.origin}/mandate/${intake.token}`)
    setCopied(true); setTimeout(()=>setCopied(false), 2000)
  }
  async function acceptSubmission(idx:number) {
    if(!intake) return
    const sub = intake.submissions[idx]
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    // Create client + case
    await supabase.from('kanzlei_clients').insert({ user_id:user.id, first_name:sub.name.split(' ')[0], last_name:sub.name.split(' ').slice(1).join(' '), email:sub.email, phone:sub.phone })
    await supabase.from('cases').insert({ user_id:user.id, title:sub.subject, description:sub.description })
    // Remove from submissions
    const newSubs = intake.submissions.filter((_,i)=>i!==idx)
    await supabase.from('mandate_intake').update({submissions:newSubs}).eq('id',intake.id)
    load()
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Online-Mandatsannahme</h2>

      {!intake ? (
        <Card className="p-8 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <p className="text-navy-500 mb-4">Erstellen Sie ein Online-Formular, über das potenzielle Mandanten ihre Anfragen direkt einreichen können.</p>
          <Button variant="primary" onClick={create}>Mandatsannahme aktivieren</Button>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-navy-800">Formular-Link</h3>
                <Badge variant={intake.is_active?'success':'error'}>{intake.is_active?'Aktiv':'Inaktiv'}</Badge>
              </div>
              <button onClick={toggle} className="text-sm text-navy-500 cursor-pointer hover:text-navy-700">{intake.is_active?'Deaktivieren':'Aktivieren'}</button>
            </div>
            <div className="flex gap-2">
              <input readOnly value={`${typeof window!=='undefined'?window.location.origin:''}/mandate/${intake.token}`} className="flex-1 px-4 py-2 rounded-xl bg-navy-50 text-sm text-navy-600 border border-navy-200"/>
              <Button variant="primary" size="sm" onClick={copyLink}>{copied?'✅ Kopiert!':'📋 Kopieren'}</Button>
            </div>
            <p className="text-xs text-navy-400 mt-2">Teilen Sie diesen Link auf Ihrer Website oder per E-Mail. Mandanten können darüber ihre Anfrage einreichen.</p>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy-800">Eingegangene Anfragen ({intake.submissions.length})</h3>
          </div>

          {intake.submissions.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Noch keine Anfragen eingegangen.</p></Card>:(
            <div className="space-y-3">{intake.submissions.map((sub,i)=>(
              <Card key={i} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-navy-800">{sub.subject}</h4>
                    <p className="text-sm text-navy-400">{sub.name} · {sub.email}{sub.phone?` · ${sub.phone}`:''}</p>
                    <p className="text-sm text-navy-500 mt-2">{sub.description}</p>
                    <p className="text-xs text-navy-300 mt-1">{new Date(sub.date).toLocaleString('de-DE')}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>acceptSubmission(i)} className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-800">✅ Annehmen (Akte + Mandant anlegen)</button>
                  <button onClick={async()=>{const newSubs=intake.submissions.filter((_,j)=>j!==i);await supabase.from('mandate_intake').update({submissions:newSubs}).eq('id',intake.id);load()}} className="text-xs text-red-500 cursor-pointer hover:text-red-700">❌ Ablehnen</button>
                </div>
              </Card>
            ))}</div>
          )}
        </>
      )}
    </div>
  )
}
