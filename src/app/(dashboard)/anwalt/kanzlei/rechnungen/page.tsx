'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface Invoice { id:string; invoice_number:string|null; total_amount:number|null; tax_amount:number|null; status:string; billing_type:string; items:Array<{desc:string;qty:number;rate:number}>; created_at:string; client_name?:string; client_id:string|null; invoice_type:string|null; credited_invoice_id:string|null; payment_plan:unknown|null; paid_amount?:number }
interface Client { id:string; first_name:string|null; last_name:string|null; company_name:string|null }
interface TimeEntry { id:string; description:string; duration_minutes:number; hourly_rate:number|null; date:string; invoiced:boolean }
interface Payment { id:string; invoice_id:string; amount:number; payment_date:string; payment_method:string; notes:string|null }

const statusMap:Record<string,{label:string;variant:'success'|'warning'|'error'|'neutral'}> = {
  draft:{label:'Entwurf',variant:'neutral'}, sent:{label:'Versendet',variant:'warning'},
  paid:{label:'Bezahlt',variant:'success'}, partial:{label:'Teilbezahlt',variant:'warning'},
  overdue:{label:'Überfällig',variant:'error'}, cancelled:{label:'Storniert',variant:'error'},
  gutschrift:{label:'Gutschrift',variant:'neutral'},
}

export default function RechnungenPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [unbilledEntries, setUnbilledEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [detailInv, setDetailInv] = useState<Invoice|null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [payForm, setPayForm] = useState({amount:'',payment_date:new Date().toISOString().split('T')[0],payment_method:'ueberweisung',notes:''})
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(()=>{loadAll()},[]) // eslint-disable-line

  async function loadAll() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const [{data:inv},{data:cl},{data:te}] = await Promise.all([
      supabase.from('kanzlei_invoices').select('*, kanzlei_clients(first_name,last_name,company_name)').eq('user_id',user.id).order('created_at',{ascending:false}),
      supabase.from('kanzlei_clients').select('id,first_name,last_name,company_name').eq('user_id',user.id),
      supabase.from('time_entries').select('*').eq('user_id',user.id).eq('billable',true).eq('invoiced',false).order('date'),
    ])
    // Get paid amounts
    const invIds = (inv||[]).map((i:Record<string,unknown>)=>i.id as string)
    let paymentData:Payment[] = []
    if(invIds.length>0) {
      const { data:pd } = await supabase.from('invoice_payments').select('*').in('invoice_id',invIds)
      paymentData = (pd||[]) as Payment[]
    }
    setInvoices((inv||[]).map((i:Record<string,unknown>)=>{
      const c = i.kanzlei_clients as {first_name:string;last_name:string;company_name:string|null}|null
      const paidAmount = paymentData.filter(p=>p.invoice_id===i.id).reduce((s,p)=>s+p.amount,0)
      return {...i, client_name:c?`${c.first_name} ${c.last_name}${c.company_name?` (${c.company_name})`:''}`:'', paid_amount:paidAmount}
    }) as Invoice[])
    setClients((cl||[]) as Client[])
    setUnbilledEntries((te||[]) as TimeEntry[])
    setLoading(false)
  }

  async function createInvoice() {
    setCreating(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const entries = unbilledEntries.filter(e=>selectedEntries.includes(e.id))
    const items = entries.map(e=>({desc:e.description,qty:e.duration_minutes,rate:e.hourly_rate||250}))
    const net = entries.reduce((s,e)=>s+(e.duration_minutes/60)*(e.hourly_rate||250),0)
    const tax = net*0.19
    const num = `JL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    await supabase.from('kanzlei_invoices').insert({user_id:user.id,client_id:selectedClient||null,invoice_number:num,total_amount:net+tax,tax_amount:tax,status:'draft',items,invoice_type:'rechnung'})
    if(selectedEntries.length>0) await supabase.from('time_entries').update({invoiced:true}).in('id',selectedEntries)
    setShowCreate(false);setSelectedClient('');setSelectedEntries([]);setCreating(false);loadAll()
  }

  async function createGutschrift(inv:Invoice) {
    if(!confirm(`Gutschrift für Rechnung ${inv.invoice_number} erstellen?`)) return
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const num = `GS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    await supabase.from('kanzlei_invoices').insert({
      user_id:user.id, client_id:inv.client_id, invoice_number:num,
      total_amount:-(inv.total_amount||0), tax_amount:-(inv.tax_amount||0),
      status:'gutschrift', items:inv.items, invoice_type:'gutschrift', credited_invoice_id:inv.id
    })
    await supabase.from('kanzlei_invoices').update({status:'cancelled'}).eq('id',inv.id)
    loadAll()
  }

  async function addPayment() {
    if(!detailInv) return
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const amount = parseFloat(payForm.amount)||0
    await supabase.from('invoice_payments').insert({
      invoice_id:detailInv.id, user_id:user.id, amount, payment_date:payForm.payment_date,
      payment_method:payForm.payment_method, notes:payForm.notes||null
    })
    // Check if fully paid
    const newPaid = (detailInv.paid_amount||0)+amount
    const total = detailInv.total_amount||0
    const newStatus = newPaid>=total?'paid':'partial'
    await supabase.from('kanzlei_invoices').update({status:newStatus}).eq('id',detailInv.id)
    setShowPayment(false);setPayForm({amount:'',payment_date:new Date().toISOString().split('T')[0],payment_method:'ueberweisung',notes:''})
    setDetailInv(null);loadAll()
  }

  async function openDetail(inv:Invoice) {
    setDetailInv(inv)
    const { data } = await supabase.from('invoice_payments').select('*').eq('invoice_id',inv.id).order('payment_date')
    setPayments((data||[]) as Payment[])
  }

  async function updateStatus(id:string, status:string) {
    await supabase.from('kanzlei_invoices').update({status}).eq('id',id)
    setDetailInv(null);loadAll()
  }

  async function downloadPDF(inv:Invoice) {
    try {
      const res = await fetch('/api/anwalt/invoice-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId:inv.id})})
      if(res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href=url;a.download=`${inv.invoice_number||'rechnung'}.html`;a.click()
      }
    } catch{/* ignore */}
  }

  async function generateMahnung(inv:Invoice) {
    const remaining = (inv.total_amount||0)-(inv.paid_amount||0)
    const text = `MAHNUNG\n\nSehr geehrte/r Mandant/in,\n\nwir erlauben uns, Sie an den offenen Rechnungsbetrag zu erinnern:\n\nRechnung: ${inv.invoice_number}\nGesamtbetrag: ${(inv.total_amount||0).toFixed(2)} €\nBereits gezahlt: ${(inv.paid_amount||0).toFixed(2)} €\nOffener Betrag: ${remaining.toFixed(2)} €\n\nBitte überweisen Sie den offenen Betrag innerhalb von 14 Tagen.\n\nMit freundlichen Grüßen\nIhre Kanzlei`
    const blob = new Blob([text],{type:'text/plain;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url;a.download=`Mahnung-${inv.invoice_number||'rechnung'}.txt`;a.click()
  }

  function toggleEntry(id:string) { setSelectedEntries(prev=>prev.includes(id)?prev.filter(e=>e!==id):[...prev,id]) }

  const selectedTotal = unbilledEntries.filter(e=>selectedEntries.includes(e.id)).reduce((s,e)=>s+(e.duration_minutes/60)*(e.hourly_rate||250),0)
  const filtered = filterStatus==='all'?invoices:invoices.filter(i=>i.status===filterStatus)

  const totalOffen = invoices.filter(i=>['sent','partial','overdue'].includes(i.status)).reduce((s,i)=>s+(i.total_amount||0)-(i.paid_amount||0),0)
  const totalBezahlt = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.total_amount||0),0)

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-navy-800">Rechnungen</h2><p className="text-sm text-navy-400">Rechnungswesen mit Teilzahlungen & Gutschriften</p></div>
        <Button variant="primary" size="sm" onClick={()=>setShowCreate(!showCreate)}>{showCreate?'Abbrechen':'+ Neue Rechnung'}</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-navy-400">Gesamt</p><p className="text-xl font-bold text-navy-900">{invoices.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Offen</p><p className="text-xl font-bold text-amber-600">{totalOffen.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Bezahlt</p><p className="text-xl font-bold text-emerald-600">{totalBezahlt.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Unbilled Time</p><p className="text-xl font-bold text-navy-600">{unbilledEntries.length} Einträge</p></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all','draft','sent','partial','paid','overdue','cancelled','gutschrift'].map(s=>(
          <button key={s} onClick={()=>setFilterStatus(s)} className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${filterStatus===s?'bg-navy-800 text-white':'bg-white text-navy-600 border border-navy-200'}`}>
            {s==='all'?'Alle':statusMap[s]?.label||s}
          </button>
        ))}
      </div>

      {showCreate && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Rechnung erstellen</h3>
          <div><label className="text-sm text-navy-400 block mb-1">Mandant</label>
            <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              <option value="">— Ohne Zuordnung —</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.company_name?` (${c.company_name})`:''}</option>)}
            </select>
          </div>
          {unbilledEntries.length>0?(
            <div>
              <p className="text-sm text-navy-500 mb-2">Nicht abgerechnete Zeiteinträge:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">{unbilledEntries.map(e=>(
                <label key={e.id} className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl cursor-pointer hover:bg-navy-100">
                  <input type="checkbox" checked={selectedEntries.includes(e.id)} onChange={()=>toggleEntry(e.id)} className="w-4 h-4 rounded"/>
                  <div className="flex-1"><p className="text-sm font-medium text-navy-800">{e.description}</p><p className="text-xs text-navy-400">{new Date(e.date).toLocaleDateString('de-DE')} · {e.duration_minutes} Min.</p></div>
                  <span className="text-sm font-bold text-navy-700">{((e.duration_minutes/60)*(e.hourly_rate||250)).toFixed(2)} €</span>
                </label>
              ))}</div>
              {selectedEntries.length>0&&<div className="flex items-center justify-between mt-3 p-3 bg-gold-50 rounded-xl"><span className="text-sm text-navy-600">{selectedEntries.length} ausgewählt</span><span className="font-bold text-navy-800">{selectedTotal.toFixed(2)} € netto + {(selectedTotal*0.19).toFixed(2)} € MwSt = {(selectedTotal*1.19).toFixed(2)} € brutto</span></div>}
            </div>
          ):<p className="text-sm text-navy-400">Keine offenen Zeiteinträge.</p>}
          <Button variant="primary" size="sm" onClick={createInvoice} loading={creating} disabled={selectedEntries.length===0}>Rechnung erstellen</Button>
        </Card>
      )}

      {/* Detail View */}
      {detailInv && (
        <Card className="p-6 space-y-4 border-2 border-gold-400">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-navy-800 text-lg">{detailInv.invoice_number}</h3>
              <p className="text-sm text-navy-500">{detailInv.client_name||'Kein Mandant'} · {new Date(detailInv.created_at).toLocaleDateString('de-DE')}</p>
              <Badge variant={statusMap[detailInv.status]?.variant||'neutral'}>{statusMap[detailInv.status]?.label||detailInv.status}</Badge>
            </div>
            <button onClick={()=>setDetailInv(null)} className="text-navy-400 hover:text-navy-600 cursor-pointer">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-navy-50 rounded-xl"><p className="text-xs text-navy-400">Gesamt</p><p className="font-bold">{(detailInv.total_amount||0).toFixed(2)} €</p></div>
            <div className="p-3 bg-green-50 rounded-xl"><p className="text-xs text-navy-400">Bezahlt</p><p className="font-bold text-green-600">{(detailInv.paid_amount||0).toFixed(2)} €</p></div>
            <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-navy-400">Offen</p><p className="font-bold text-amber-600">{((detailInv.total_amount||0)-(detailInv.paid_amount||0)).toFixed(2)} €</p></div>
          </div>
          {/* Payments */}
          {payments.length>0&&(
            <div><h4 className="text-sm font-semibold text-navy-700 mb-2">Zahlungen</h4>
              {payments.map(p=>(
                <div key={p.id} className="flex items-center justify-between p-2 bg-navy-50 rounded-xl mb-1">
                  <span className="text-sm text-navy-600">{new Date(p.payment_date).toLocaleDateString('de-DE')} — {p.payment_method}</span>
                  <span className="font-medium text-green-600">{p.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {!['paid','cancelled','gutschrift'].includes(detailInv.status)&&<Button variant="primary" size="sm" onClick={()=>setShowPayment(!showPayment)}>💰 Zahlung erfassen</Button>}
            {detailInv.status==='draft'&&<Button variant="secondary" size="sm" onClick={()=>updateStatus(detailInv.id,'sent')}>📨 Als versendet</Button>}
            {['sent','partial'].includes(detailInv.status)&&<Button variant="secondary" size="sm" onClick={()=>updateStatus(detailInv.id,'overdue')}>⚠️ Überfällig</Button>}
            <Button variant="secondary" size="sm" onClick={()=>downloadPDF(detailInv)}>📄 PDF</Button>
            {!['cancelled','gutschrift'].includes(detailInv.status)&&<Button variant="secondary" size="sm" onClick={()=>createGutschrift(detailInv)}>↩️ Gutschrift</Button>}
            {['sent','overdue','partial'].includes(detailInv.status)&&<Button variant="secondary" size="sm" onClick={()=>generateMahnung(detailInv)}>📬 Mahnung</Button>}
          </div>
          {showPayment&&(
            <div className="p-4 bg-green-50 rounded-xl space-y-3">
              <h4 className="font-semibold text-navy-800">Zahlung erfassen</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Betrag (€)" type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} placeholder={((detailInv.total_amount||0)-(detailInv.paid_amount||0)).toFixed(2)}/>
                <Input label="Datum" type="date" value={payForm.payment_date} onChange={e=>setPayForm({...payForm,payment_date:e.target.value})}/>
              </div>
              <div><label className="block text-sm font-medium text-navy-700 mb-1">Zahlungsart</label>
                <select value={payForm.payment_method} onChange={e=>setPayForm({...payForm,payment_method:e.target.value})} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
                  <option value="ueberweisung">Überweisung</option><option value="bar">Bar</option><option value="paypal">PayPal</option><option value="kreditkarte">Kreditkarte</option><option value="lastschrift">Lastschrift</option>
                </select>
              </div>
              <Input label="Anmerkung" value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})} placeholder="Optional"/>
              <Button variant="primary" size="sm" onClick={addPayment} disabled={!payForm.amount}>Zahlung buchen</Button>
            </div>
          )}
        </Card>
      )}

      {/* Invoice List */}
      {filtered.length===0?<Card className="p-8 text-center"><p className="text-navy-400">Keine Rechnungen.</p></Card>:(
        <div className="space-y-2">{filtered.map(inv=>{
          const st = statusMap[inv.status]||statusMap.draft
          const remaining = (inv.total_amount||0)-(inv.paid_amount||0)
          return(
            <Card key={inv.id} className="p-4 cursor-pointer hover:border-gold-300 transition-colors" onClick={()=>openDetail(inv)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy-800">{inv.invoice_number||'—'}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {inv.invoice_type==='gutschrift'&&<Badge variant="neutral">Gutschrift</Badge>}
                  </div>
                  <p className="text-sm text-navy-400 mt-0.5">{inv.client_name||'Kein Mandant'} · {new Date(inv.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-navy-900">{(inv.total_amount||0).toFixed(2)} €</span>
                  {(inv.paid_amount||0)>0&&remaining>0&&<p className="text-xs text-amber-600">Offen: {remaining.toFixed(2)} €</p>}
                </div>
              </div>
            </Card>
          )
        })}</div>
      )}
    </div>
  )
}
