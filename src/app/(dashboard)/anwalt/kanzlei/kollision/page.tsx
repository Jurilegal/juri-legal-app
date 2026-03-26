'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Match { table: string; id: string; name: string; role: string; case_title?: string; reference?: string }

export default function KollisionPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Match[]|null>(null)

  async function search() {
    if(!name.trim()) return
    setSearching(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) { setSearching(false); return }
    const q = name.trim().toLowerCase()
    const matches: Match[] = []

    // Search in cases (opponent)
    const { data: cases } = await supabase.from('cases').select('id,title,reference_number,opponent_name').eq('user_id',user.id)
    for(const c of (cases||[])) {
      if(c.opponent_name?.toLowerCase().includes(q)) matches.push({ table:'cases', id:c.id, name:c.opponent_name, role:'Gegner', case_title:c.title, reference:c.reference_number })
      // Check participants
      const participants = (c as Record<string,unknown>).participants as Array<{name:string;role:string}>|undefined
      if(participants) for(const p of participants) { if(p.name?.toLowerCase().includes(q)) matches.push({ table:'cases', id:c.id, name:p.name, role:p.role||'Beteiligter', case_title:c.title, reference:c.reference_number }) }
    }

    // Search in kanzlei_clients
    const { data: clients } = await supabase.from('kanzlei_clients').select('id,first_name,last_name,company_name').eq('user_id',user.id)
    for(const c of (clients||[])) {
      const fullName = `${c.first_name||''} ${c.last_name||''}`.trim()
      if(fullName.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q))
        matches.push({ table:'kanzlei_clients', id:c.id, name: fullName || c.company_name || '', role:'Mandant' })
    }

    // Search in contacts
    const { data: contacts } = await supabase.from('kanzlei_contacts').select('id,first_name,last_name,company_name,contact_type').eq('user_id',user.id)
    for(const c of (contacts||[])) {
      const fullName = `${c.first_name||''} ${c.last_name||''}`.trim()
      if(fullName.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q))
        matches.push({ table:'kanzlei_contacts', id:c.id, name: fullName || c.company_name || '', role:c.contact_type })
    }

    setResults(matches); setSearching(false)
  }

  const hasConflict = results && results.some(r => r.role === 'Gegner') && results.some(r => r.role === 'Mandant')

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Kollisionsprüfung</h2>
      <Card className="p-6">
        <p className="text-sm text-navy-500 mb-4">Prüfen Sie vor Mandatsannahme, ob eine Person/Firma bereits als Gegner in einer anderen Akte geführt wird (Interessenkonflikt nach § 43a BRAO).</p>
        <div className="flex gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
            placeholder="Name der Person oder Firma eingeben..." className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-sm"/>
          <Button variant="primary" onClick={search} loading={searching}>🔍 Prüfen</Button>
        </div>
      </Card>

      {results !== null && (
        hasConflict ? (
          <Card className="p-6 border-red-300 bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-red-800">INTERESSENKONFLIKT ERKANNT!</h3>
                <p className="text-sm text-red-600">Die Person/Firma tritt sowohl als Mandant als auch als Gegner auf.</p>
              </div>
            </div>
            <div className="space-y-2">{results.map((r,i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div><span className="font-medium text-navy-800">{r.name}</span>{r.case_title && <span className="text-xs text-navy-400 ml-2">in: {r.case_title}{r.reference?` (${r.reference})`:''}</span>}</div>
                <Badge variant={r.role==='Gegner'?'error':r.role==='Mandant'?'success':'neutral'}>{r.role}</Badge>
              </div>
            ))}</div>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-6 border-emerald-300 bg-emerald-50">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div><h3 className="font-bold text-emerald-800">Kein Konflikt</h3><p className="text-sm text-emerald-600">&quot;{name}&quot; wurde in keiner Akte als Beteiligter gefunden.</p></div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border-amber-300 bg-amber-50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔍</span>
              <div><h3 className="font-bold text-amber-800">{results.length} Treffer gefunden</h3><p className="text-sm text-amber-600">Kein direkter Interessenkonflikt, aber Einträge vorhanden.</p></div>
            </div>
            <div className="space-y-2">{results.map((r,i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div><span className="font-medium text-navy-800">{r.name}</span>{r.case_title && <span className="text-xs text-navy-400 ml-2">in: {r.case_title}</span>}</div>
                <Badge variant="neutral">{r.role}</Badge>
              </div>
            ))}</div>
          </Card>
        )
      )}
    </div>
  )
}
