'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function MandatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const supabase = createClient()
  const [valid, setValid] = useState<boolean|null>(null)
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', description:'' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from('mandate_intake').select('id,is_active').eq('token',token).single()
      setValid(!!data?.is_active)
    })()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setSending(true)
    const { data } = await supabase.from('mandate_intake').select('id,submissions').eq('token',token).single()
    if(!data) return
    const submissions = [...(data.submissions as Array<Record<string,string>>||[]), {...form, date:new Date().toISOString()}]
    await supabase.from('mandate_intake').update({submissions}).eq('id',data.id)
    setSent(true); setSending(false)
  }

  if(valid===null) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>
  if(!valid) return <div className="min-h-screen flex items-center justify-center"><Card className="p-8 text-center max-w-md"><p className="text-navy-500">Dieses Formular ist nicht mehr aktiv.</p><Link href="/" className="text-gold-500 text-sm mt-2 block">Zur Startseite →</Link></Card></div>

  if(sent) return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 to-white flex items-center justify-center">
      <Card className="p-12 text-center max-w-md">
        <span className="text-5xl block mb-4">✅</span>
        <h2 className="text-2xl font-bold text-navy-800 mb-2">Anfrage gesendet!</h2>
        <p className="text-navy-500">Vielen Dank für Ihre Anfrage. Der Anwalt wird sich in Kürze bei Ihnen melden.</p>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 to-white py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy-800"><span className="text-gold-500">Juri</span>Legal</h1>
          <p className="text-navy-400 mt-2">Online-Mandatsannahme</p>
        </div>
        <Card className="p-8 space-y-4">
          <h2 className="text-xl font-bold text-navy-800">Ihre Anfrage</h2>
          <p className="text-sm text-navy-500">Füllen Sie das Formular aus und der Anwalt wird sich bei Ihnen melden.</p>
          <Input label="Ihr Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <Input label="E-Mail *" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          <Input label="Telefon" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          <Input label="Betreff / Rechtsgebiet *" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
          <div><label className="text-sm text-navy-400 block mb-1">Sachverhalt *</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={5} placeholder="Beschreiben Sie Ihr Anliegen..." className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y"/></div>
          <Button variant="primary" onClick={submit} loading={sending} disabled={!form.name||!form.email||!form.subject||!form.description}>Anfrage absenden</Button>
          <p className="text-xs text-navy-300 text-center">Ihre Daten werden vertraulich behandelt und nur an den jeweiligen Anwalt weitergeleitet.</p>
        </Card>
      </div>
    </div>
  )
}
