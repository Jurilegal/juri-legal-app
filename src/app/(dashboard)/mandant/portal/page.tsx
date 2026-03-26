'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface PortalCase { id:string; title:string; status:string; reference_number:string|null; description:string|null; created_at:string }
interface PortalDoc { id:string; name:string; created_at:string; category:string|null; case_id?:string }
interface PortalDeadline { id:string; title:string; due_date:string; status:string; case_id?:string }
interface PortalInvoice { id:string; invoice_number:string; total_amount:number; status:string; created_at:string }

export default function MandantPortalPage() {
  const supabase = createClient()
  const [cases, setCases] = useState<PortalCase[]>([])
  const [documents, setDocuments] = useState<PortalDoc[]>([])
  const [deadlines, setDeadlines] = useState<PortalDeadline[]>([])
  const [invoices, setInvoices] = useState<PortalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<string|null>(null)

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    // Mandant sieht Akten die ihm zugeordnet sind (über kanzlei_clients email match oder direct assignment)
    const { data:profile } = await supabase.from('profiles').select('email').eq('id',user.id).single()
    if(!profile) return

    // Get client records matching this email
    const { data:clientRecords } = await supabase.from('kanzlei_clients').select('id').eq('email',profile.email)
    const clientIds = (clientRecords||[]).map(c=>c.id)

    if(clientIds.length>0) {
      const { data:casesData } = await supabase.from('cases').select('id,title,status,reference_number,description,created_at').in('client_id',clientIds).order('created_at',{ascending:false})
      setCases((casesData||[]) as PortalCase[])
      const caseIds = (casesData||[]).map(c=>c.id)
      if(caseIds.length>0) {
        const [docsRes, deadlinesRes, invoicesRes] = await Promise.all([
          supabase.from('case_documents').select('id,name,created_at,category').in('case_id',caseIds).order('created_at',{ascending:false}),
          supabase.from('deadlines').select('id,title,due_date,status').in('case_id',caseIds).neq('type','wiedervorlage').order('due_date'),
          supabase.from('kanzlei_invoices').select('id,invoice_number,total_amount,status,created_at').in('client_id',clientIds).order('created_at',{ascending:false}),
        ])
        setDocuments((docsRes.data||[]) as PortalDoc[])
        setDeadlines((deadlinesRes.data||[]) as PortalDeadline[])
        setInvoices((invoicesRes.data||[]) as PortalInvoice[])
      }
    }
    setLoading(false)
  }

  const statusLabels:Record<string,{label:string;variant:'neutral'|'warning'|'error'|'success'}> = {
    active:{label:'Aktiv',variant:'success'}, pending:{label:'Ausstehend',variant:'warning'},
    closed:{label:'Abgeschlossen',variant:'neutral'}, archived:{label:'Archiviert',variant:'neutral'},
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  const activeCase = selectedCase ? cases.find(c=>c.id===selectedCase) : null
  const caseDocs = selectedCase ? documents.filter(d=>d.case_id===selectedCase) : []
  const caseDeadlines = selectedCase ? deadlines.filter(d=>d.case_id===selectedCase) : []

  if(activeCase) return (
    <div className="space-y-6">
      <button onClick={()=>setSelectedCase(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Alle Akten</button>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-navy-800">{activeCase.title}</h2>
          <Badge variant={statusLabels[activeCase.status]?.variant||'neutral'}>{statusLabels[activeCase.status]?.label||activeCase.status}</Badge>
        </div>
        {activeCase.reference_number && <p className="text-xs text-navy-400">Az: {activeCase.reference_number}</p>}
        {activeCase.description && <p className="text-sm text-navy-500 mt-2">{activeCase.description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-3">📄 Dokumente ({caseDocs.length})</h3>
          {caseDocs.length===0?<p className="text-sm text-navy-400">Keine Dokumente.</p>:(
            <div className="space-y-2">{caseDocs.map(d=>(
              <div key={d.id} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <div><p className="text-sm font-medium text-navy-800">{d.name}</p><p className="text-xs text-navy-400">{new Date(d.created_at).toLocaleDateString('de-DE')}{d.category?` · ${d.category}`:''}</p></div>
              </div>
            ))}</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-3">📅 Termine & Fristen ({caseDeadlines.length})</h3>
          {caseDeadlines.length===0?<p className="text-sm text-navy-400">Keine Termine.</p>:(
            <div className="space-y-2">{caseDeadlines.map(d=>{
              const overdue = d.status==='pending' && d.due_date<new Date().toISOString().split('T')[0]
              return(
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-xl ${overdue?'bg-red-50':'bg-navy-50'}`}>
                  <div><p className="text-sm font-medium text-navy-800">{d.title}</p><p className="text-xs text-navy-400">{new Date(d.due_date).toLocaleDateString('de-DE')}</p></div>
                  <Badge variant={d.status==='done'?'success':overdue?'error':'warning'}>{d.status==='done'?'Erledigt':overdue?'Überfällig':'Offen'}</Badge>
                </div>
              )
            })}</div>
          )}
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Mandantenportal</h2>
      <p className="text-sm text-navy-500">Hier sehen Sie den Status Ihrer Akten, Dokumente und Rechnungen auf einen Blick.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Ihre Akten</p><p className="text-2xl font-bold text-navy-900">{cases.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Dokumente</p><p className="text-2xl font-bold text-navy-900">{documents.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Offene Fristen</p><p className="text-2xl font-bold text-amber-600">{deadlines.filter(d=>d.status==='pending').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Offene Rechnungen</p><p className="text-2xl font-bold text-red-600">{invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.total_amount,0).toFixed(2)} €</p></Card>
      </div>

      {/* Cases */}
      <div>
        <h3 className="font-semibold text-navy-800 mb-3">Ihre Akten</h3>
        {cases.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Ihnen sind noch keine Akten zugeordnet.</p></Card>:(
          <div className="space-y-2">{cases.map(c=>(
            <Card key={c.id} className="p-4 cursor-pointer hover:border-gold-300 transition-colors" onClick={()=>setSelectedCase(c.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium text-navy-800">{c.title}</span><Badge variant={statusLabels[c.status]?.variant||'neutral'}>{statusLabels[c.status]?.label||c.status}</Badge></div>
                  {c.reference_number && <p className="text-xs text-navy-400 mt-0.5">Az: {c.reference_number}</p>}
                </div>
                <span className="text-navy-300">→</span>
              </div>
            </Card>
          ))}</div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length>0 && (
        <div>
          <h3 className="font-semibold text-navy-800 mb-3">Rechnungen</h3>
          <div className="space-y-2">{invoices.map(inv=>(
            <Card key={inv.id} className="p-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-navy-800">{inv.invoice_number}</p><p className="text-xs text-navy-400">{new Date(inv.created_at).toLocaleDateString('de-DE')}</p></div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-navy-900">{inv.total_amount.toFixed(2)} €</span>
                  <Badge variant={inv.status==='paid'?'success':inv.status==='overdue'?'error':'warning'}>{inv.status==='paid'?'Bezahlt':inv.status==='overdue'?'Überfällig':'Offen'}</Badge>
                </div>
              </div>
            </Card>
          ))}</div>
        </div>
      )}
    </div>
  )
}
