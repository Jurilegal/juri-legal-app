'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Contact { id: string; contact_type: string; first_name: string|null; last_name: string|null; company_name: string|null; email: string|null; phone: string|null; fax: string|null; address: string|null; zip: string|null; city: string|null; notes: string|null; created_at: string }

const typeLabels: Record<string,{label:string;emoji:string;variant:'success'|'warning'|'error'|'neutral'}> = {
  mandant:{label:'Mandant',emoji:'👤',variant:'success'}, gegner:{label:'Gegner',emoji:'⚔️',variant:'error'},
  gericht:{label:'Gericht',emoji:'🏛️',variant:'neutral'}, sachverstaendiger:{label:'Sachverständiger',emoji:'🔬',variant:'neutral'},
  behoerde:{label:'Behörde',emoji:'🏢',variant:'warning'}, notar:{label:'Notar',emoji:'📜',variant:'neutral'},
  sonstige:{label:'Sonstige',emoji:'📋',variant:'neutral'},
}

export default function KontaktePage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contact|null>(null)
  const [form, setForm] = useState({ contact_type:'mandant', first_name:'', last_name:'', company_name:'', email:'', phone:'', fax:'', address:'', zip:'', city:'', notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('kanzlei_contacts').select('*').eq('user_id',user.id).order('last_name')
    setContacts((data||[]) as Contact[]); setLoading(false)
  }
  async function save() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    if(editing) await supabase.from('kanzlei_contacts').update(form).eq('id',editing.id)
    else await supabase.from('kanzlei_contacts').insert({...form, user_id:user.id})
    resetForm(); setSaving(false); load()
  }
  async function deleteContact(id:string) {
    if(!confirm('Kontakt wirklich löschen?')) return
    await supabase.from('kanzlei_contacts').delete().eq('id',id); load()
  }
  function editContact(c:Contact) {
    setForm({ contact_type:c.contact_type, first_name:c.first_name||'', last_name:c.last_name||'', company_name:c.company_name||'', email:c.email||'', phone:c.phone||'', fax:c.fax||'', address:c.address||'', zip:c.zip||'', city:c.city||'', notes:c.notes||'' })
    setEditing(c); setShowForm(true)
  }
  function resetForm() { setForm({ contact_type:'mandant', first_name:'', last_name:'', company_name:'', email:'', phone:'', fax:'', address:'', zip:'', city:'', notes:'' }); setEditing(null); setShowForm(false) }

  const filtered = contacts.filter(c => {
    if(filterType && c.contact_type !== filterType) return false
    if(!search) return true
    const s = search.toLowerCase()
    return [c.first_name,c.last_name,c.company_name,c.email,c.city].some(f => f?.toLowerCase().includes(s))
  })

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-navy-800">Adressverwaltung</h2>
        <div className="flex gap-2">
          <Input placeholder="Suchen..." value={search} onChange={e=>setSearch(e.target.value)} className="w-40"/>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="px-3 py-2 rounded-xl border border-navy-200 text-sm">
            <option value="">Alle Typen</option>
            {Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={()=>{resetForm();setShowForm(!showForm)}}>{showForm?'Abbrechen':'+ Kontakt'}</Button>
        </div>
      </div>
      {showForm && (
        <Card className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(typeLabels).map(([k,v])=>(
              <button key={k} onClick={()=>setForm(f=>({...f,contact_type:k}))} className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${form.contact_type===k?'bg-navy-800 text-white':'bg-navy-100 text-navy-500'}`}>{v.emoji} {v.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Input label="Vorname" value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))}/>
            <Input label="Nachname *" value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))}/>
            <Input label="Firma/Institution" value={form.company_name} onChange={e=>setForm(f=>({...f,company_name:e.target.value}))}/>
            <Input label="E-Mail" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            <Input label="Telefon" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
            <Input label="Fax" value={form.fax} onChange={e=>setForm(f=>({...f,fax:e.target.value}))}/>
            <Input label="Straße" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
            <Input label="PLZ" value={form.zip} onChange={e=>setForm(f=>({...f,zip:e.target.value}))}/>
            <Input label="Stadt" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/>
          </div>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notizen..." rows={2} className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm mb-3 resize-y"/>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!form.last_name.trim()&&!form.company_name.trim()}>{editing?'Speichern':'Anlegen'}</Button>
            {editing && <Button variant="secondary" size="sm" onClick={resetForm}>Abbrechen</Button>}
          </div>
        </Card>
      )}
      <p className="text-sm text-navy-400">{filtered.length} Kontakte</p>
      {filtered.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Keine Kontakte.</p></Card>:(
        <div className="space-y-2">{filtered.map(c=>{
          const t = typeLabels[c.contact_type]||typeLabels.sonstige
          return(
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={()=>editContact(c)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy-800">{c.first_name} {c.last_name}{c.company_name?` · ${c.company_name}`:''}</span>
                    <Badge variant={t.variant}>{t.emoji} {t.label}</Badge>
                  </div>
                  <p className="text-xs text-navy-400 mt-0.5">{[c.email,c.phone,c.city].filter(Boolean).join(' · ')}</p>
                </div>
                <button onClick={()=>deleteContact(c.id)} className="text-red-400 hover:text-red-600 text-sm cursor-pointer">🗑️</button>
              </div>
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
