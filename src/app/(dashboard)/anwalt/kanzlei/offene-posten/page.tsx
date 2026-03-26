'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Invoice { id:string; invoice_number:string; total_amount:number; status:string; client_id:string; created_at:string; client_name?:string; days_overdue?:number }

export default function OffenePostenPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date'|'amount'|'age'>('age')

  useEffect(()=>{load()}, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data:invs } = await supabase.from('kanzlei_invoices').select('*').eq('user_id',user.id).in('status',['sent','overdue','partial']).order('created_at')
    const { data:clients } = await supabase.from('kanzlei_clients').select('id,first_name,last_name').eq('user_id',user.id)
    const clientMap = new Map((clients||[]).map(c=>[c.id, `${c.first_name} ${c.last_name}`]))
    const today = Date.now()
    const mapped = (invs||[]).map(inv => ({
      ...inv,
      client_name: clientMap.get(inv.client_id) || 'Unbekannt',
      days_overdue: Math.floor((today - new Date(inv.created_at).getTime()) / 86400000) - 14 // 14 Tage Zahlungsziel
    })) as Invoice[]
    setInvoices(mapped); setLoading(false)
  }

  const sorted = [...invoices].sort((a,b) => {
    if(sortBy==='amount') return (b.total_amount||0)-(a.total_amount||0)
    if(sortBy==='age') return (b.days_overdue||0)-(a.days_overdue||0)
    return new Date(a.created_at).getTime()-new Date(b.created_at).getTime()
  })

  const total = invoices.reduce((s,i)=>s+i.total_amount,0)
  const overdue = invoices.filter(i=>(i.days_overdue||0)>0)
  const overdueTotal = overdue.reduce((s,i)=>s+i.total_amount,0)

  // Altersstruktur
  const age0_30 = invoices.filter(i=>(i.days_overdue||0)<=30).reduce((s,i)=>s+i.total_amount,0)
  const age31_60 = invoices.filter(i=>(i.days_overdue||0)>30&&(i.days_overdue||0)<=60).reduce((s,i)=>s+i.total_amount,0)
  const age61_90 = invoices.filter(i=>(i.days_overdue||0)>60&&(i.days_overdue||0)<=90).reduce((s,i)=>s+i.total_amount,0)
  const age90plus = invoices.filter(i=>(i.days_overdue||0)>90).reduce((s,i)=>s+i.total_amount,0)

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Offene Posten (OP-Liste)</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Gesamt offen</p><p className="text-2xl font-bold text-navy-900">{total.toFixed(2)} €</p><p className="text-xs text-navy-400">{invoices.length} Rechnungen</p></Card>
        <Card className="p-4 border-red-200"><p className="text-xs text-navy-400">Davon überfällig</p><p className="text-2xl font-bold text-red-600">{overdueTotal.toFixed(2)} €</p><p className="text-xs text-red-400">{overdue.length} Rechnungen</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Ø Alter</p><p className="text-2xl font-bold text-navy-900">{invoices.length?Math.round(invoices.reduce((s,i)=>s+(i.days_overdue||0),0)/invoices.length):0} Tage</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Ø Betrag</p><p className="text-2xl font-bold text-navy-900">{invoices.length?(total/invoices.length).toFixed(0):0} €</p></Card>
      </div>

      {/* Altersstruktur */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Altersstrukturanalyse</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-600">0-30 Tage</p><p className="font-bold text-emerald-700">{age0_30.toFixed(0)} €</p></div>
          <div className="text-center p-3 bg-amber-50 rounded-xl"><p className="text-xs text-amber-600">31-60 Tage</p><p className="font-bold text-amber-700">{age31_60.toFixed(0)} €</p></div>
          <div className="text-center p-3 bg-orange-50 rounded-xl"><p className="text-xs text-orange-600">61-90 Tage</p><p className="font-bold text-orange-700">{age61_90.toFixed(0)} €</p></div>
          <div className="text-center p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-600">90+ Tage</p><p className="font-bold text-red-700">{age90plus.toFixed(0)} €</p></div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">{(['date','amount','age'] as const).map(s=>(
          <button key={s} onClick={()=>setSortBy(s)} className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${sortBy===s?'bg-navy-800 text-white':'bg-navy-50 text-navy-600'}`}>
            {s==='date'?'Nach Datum':s==='amount'?'Nach Betrag':'Nach Alter'}
          </button>
        ))}</div>
        <button onClick={()=>{
          const csv = 'Rechnungsnr.;Mandant;Betrag;Alter (Tage);Status;Datum\n' + sorted.map(i=>`${i.invoice_number};${i.client_name};${i.total_amount.toFixed(2)};${i.days_overdue};${i.status};${new Date(i.created_at).toLocaleDateString('de-DE')}`).join('\n')
          const blob = new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='OP-Liste.csv'; a.click()
        }} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800">📥 CSV Export</button>
      </div>

      {sorted.length===0?<Card className="p-8 text-center"><span className="text-4xl block mb-3">✅</span><p className="text-navy-400">Keine offenen Posten!</p></Card>:(
        <div className="space-y-2">{sorted.map(inv=>{
          const isOverdue = (inv.days_overdue||0) > 0
          return(
            <Card key={inv.id} className={`p-4 ${isOverdue?'border-red-200':''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy-800">{inv.invoice_number}</span>
                    <Badge variant={isOverdue?'error':'warning'}>{isOverdue?`${inv.days_overdue} Tage überfällig`:'Offen'}</Badge>
                  </div>
                  <p className="text-xs text-navy-400 mt-0.5">{inv.client_name} · {new Date(inv.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <span className="text-lg font-bold text-navy-900">{inv.total_amount.toFixed(2)} €</span>
              </div>
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
