'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Settings { id?:string; kanzlei_name:string; address_line1:string; address_line2:string; city:string; zip:string; phone:string; fax:string; email:string; website:string; tax_id:string; bank_name:string; iban:string; bic:string; logo_url:string; default_hourly_rate:number; default_rounding:number; bundesland:string; header_text:string; footer_text:string }

const BUNDESLAENDER = ['BW','BY','BE','BB','HB','HH','HE','MV','NI','NRW','RP','SL','SN','ST','SH','TH']
const BL_NAMES:Record<string,string> = {BW:'Baden-Württemberg',BY:'Bayern',BE:'Berlin',BB:'Brandenburg',HB:'Bremen',HH:'Hamburg',HE:'Hessen',MV:'Mecklenburg-Vorpommern',NI:'Niedersachsen',NRW:'Nordrhein-Westfalen',RP:'Rheinland-Pfalz',SL:'Saarland',SN:'Sachsen',ST:'Sachsen-Anhalt',SH:'Schleswig-Holstein',TH:'Thüringen'}

export default function EinstellungenPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Settings>({ kanzlei_name:'',address_line1:'',address_line2:'',city:'',zip:'',phone:'',fax:'',email:'',website:'',tax_id:'',bank_name:'',iban:'',bic:'',logo_url:'',default_hourly_rate:250,default_rounding:1,bundesland:'NRW',header_text:'',footer_text:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('kanzlei_settings').select('*').eq('user_id',user.id).single()
    if(data) setSettings(data as unknown as Settings)
    setLoading(false)
  }
  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { id, ...payload } = settings as Settings & {id?:string}
    void id
    if(settings.id) await supabase.from('kanzlei_settings').update(payload).eq('user_id',user.id)
    else await supabase.from('kanzlei_settings').insert({...payload, user_id:user.id})
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000); load()
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Kanzlei-Einstellungen</h2>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-navy-800">Kanzleidaten & Briefkopf</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Kanzleiname *" value={settings.kanzlei_name} onChange={e=>setSettings(s=>({...s,kanzlei_name:e.target.value}))}/>
          <Input label="Adresse Zeile 1" value={settings.address_line1} onChange={e=>setSettings(s=>({...s,address_line1:e.target.value}))}/>
          <Input label="Adresse Zeile 2" value={settings.address_line2} onChange={e=>setSettings(s=>({...s,address_line2:e.target.value}))}/>
          <div className="grid grid-cols-3 gap-2">
            <Input label="PLZ" value={settings.zip} onChange={e=>setSettings(s=>({...s,zip:e.target.value}))}/>
            <div className="col-span-2"><Input label="Stadt" value={settings.city} onChange={e=>setSettings(s=>({...s,city:e.target.value}))}/></div>
          </div>
          <Input label="Telefon" value={settings.phone} onChange={e=>setSettings(s=>({...s,phone:e.target.value}))}/>
          <Input label="Fax" value={settings.fax} onChange={e=>setSettings(s=>({...s,fax:e.target.value}))}/>
          <Input label="E-Mail" value={settings.email} onChange={e=>setSettings(s=>({...s,email:e.target.value}))}/>
          <Input label="Website" value={settings.website} onChange={e=>setSettings(s=>({...s,website:e.target.value}))}/>
          <Input label="Steuernummer / USt-IdNr." value={settings.tax_id} onChange={e=>setSettings(s=>({...s,tax_id:e.target.value}))}/>
          <Input label="Logo-URL" value={settings.logo_url} onChange={e=>setSettings(s=>({...s,logo_url:e.target.value}))}/>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-navy-800">Bankverbindung</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Bank" value={settings.bank_name} onChange={e=>setSettings(s=>({...s,bank_name:e.target.value}))}/>
          <Input label="IBAN" value={settings.iban} onChange={e=>setSettings(s=>({...s,iban:e.target.value}))}/>
          <Input label="BIC" value={settings.bic} onChange={e=>setSettings(s=>({...s,bic:e.target.value}))}/>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-navy-800">Abrechnungseinstellungen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Standard-Stundensatz (€)" type="number" value={String(settings.default_hourly_rate)} onChange={e=>setSettings(s=>({...s,default_hourly_rate:parseFloat(e.target.value)||0}))}/>
          <div><label className="text-sm text-navy-400 block mb-1">Zeitrundung</label>
            <select value={settings.default_rounding} onChange={e=>setSettings(s=>({...s,default_rounding:parseInt(e.target.value)}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              <option value="1">1 Minute (exakt)</option><option value="5">5 Minuten</option><option value="6">6 Minuten (Zehntel-Stunde)</option><option value="15">15 Minuten (Viertelstunde)</option>
            </select></div>
          <div><label className="text-sm text-navy-400 block mb-1">Bundesland (Feiertage)</label>
            <select value={settings.bundesland} onChange={e=>setSettings(s=>({...s,bundesland:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              {BUNDESLAENDER.map(bl=><option key={bl} value={bl}>{BL_NAMES[bl]}</option>)}
            </select></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-navy-800">Rechnungstexte</h3>
        <div><label className="text-sm text-navy-400 block mb-1">Kopftext (erscheint oben auf Rechnungen)</label>
          <textarea value={settings.header_text||''} onChange={e=>setSettings(s=>({...s,header_text:e.target.value}))} rows={3} className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y" placeholder="z.B. Sehr geehrte Damen und Herren, für meine Tätigkeit erlaube ich mir wie folgt abzurechnen:"/></div>
        <div><label className="text-sm text-navy-400 block mb-1">Fußtext (erscheint unten auf Rechnungen)</label>
          <textarea value={settings.footer_text||''} onChange={e=>setSettings(s=>({...s,footer_text:e.target.value}))} rows={3} className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y" placeholder="z.B. Zahlbar innerhalb von 14 Tagen ohne Abzug."/></div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save} loading={saving}>Einstellungen speichern</Button>
        {saved && <span className="text-sm text-emerald-600">✅ Gespeichert!</span>}
      </div>
    </div>
  )
}
