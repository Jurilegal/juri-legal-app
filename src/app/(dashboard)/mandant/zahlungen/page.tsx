'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Payment { id:string; amount:number; status:string; payment_method:string|null; description:string|null; created_at:string }
interface CoinTx { id:string; amount:number; tx_type:string; description:string|null; created_at:string }

export default function ZahlungenPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [coinTxs, setCoinTxs] = useState<CoinTx[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'payments'|'coins'>('payments')
  const [filter, setFilter] = useState('')
  const [totalSpent, setTotalSpent] = useState(0)
  const [thisMonth, setThisMonth] = useState(0)

  useEffect(()=>{load()},[]) // eslint-disable-line

  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data:pay } = await supabase.from('session_payments').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100)
    const allPay = (pay||[]) as Payment[]
    setPayments(allPay)

    const { data:coins } = await supabase.from('juri_coin_ledger').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100)
    setCoinTxs((coins||[]) as CoinTx[])

    const total = allPay.filter(p=>p.status==='completed').reduce((s,p)=>s+p.amount,0)
    setTotalSpent(total)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(),now.getMonth(),1).toISOString()
    const month = allPay.filter(p=>p.status==='completed'&&p.created_at>=monthStart).reduce((s,p)=>s+p.amount,0)
    setThisMonth(month)
    setLoading(false)
  }

  const statusBadge = (s:string) => {
    if(s==='completed'||s==='succeeded') return <Badge variant="success">Bezahlt</Badge>
    if(s==='pending') return <Badge variant="warning">Ausstehend</Badge>
    if(s==='refunded') return <Badge variant="neutral">Erstattet</Badge>
    return <Badge variant="neutral">{s}</Badge>
  }

  const filtered = tab==='payments' 
    ? payments.filter(p=>!filter||`${p.description} ${p.payment_method}`.toLowerCase().includes(filter.toLowerCase()))
    : coinTxs.filter(t=>!filter||`${t.description} ${t.tx_type}`.toLowerCase().includes(filter.toLowerCase()))

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-navy-800">💳 Zahlungen</h2><p className="text-sm text-navy-400">Übersicht Ihrer Zahlungen und Transaktionen</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-xs text-navy-400">Gesamt ausgegeben</p><p className="text-xl font-bold text-navy-900">{totalSpent.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Diesen Monat</p><p className="text-xl font-bold text-gold-600">{thisMonth.toFixed(2)} €</p></Card>
        <Card className="p-4"><p className="text-xs text-navy-400">Transaktionen</p><p className="text-xl font-bold text-navy-900">{payments.length + coinTxs.length}</p></Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-1">
          <button onClick={()=>setTab('payments')} className={`px-4 py-2 rounded-xl text-sm cursor-pointer ${tab==='payments'?'bg-navy-800 text-white':'bg-navy-100 text-navy-500'}`}>💳 Zahlungen</button>
          <button onClick={()=>setTab('coins')} className={`px-4 py-2 rounded-xl text-sm cursor-pointer ${tab==='coins'?'bg-navy-800 text-white':'bg-navy-100 text-navy-500'}`}>🪙 Coins</button>
        </div>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="🔍 Filtern..." className="px-3 py-2 rounded-xl border border-navy-200 text-sm flex-1"/>
      </div>

      {tab==='payments' ? (
        <Card className="overflow-x-auto">
          {filtered.length===0 ? <div className="p-8 text-center text-navy-400 text-sm">Keine Zahlungen gefunden</div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100">
                <th className="text-left p-3 text-navy-500">Datum</th>
                <th className="text-left p-3 text-navy-500">Beschreibung</th>
                <th className="text-left p-3 text-navy-500">Methode</th>
                <th className="text-right p-3 text-navy-500">Betrag</th>
                <th className="text-left p-3 text-navy-500">Status</th>
              </tr></thead>
              <tbody>
                {(filtered as Payment[]).map(p=>(
                  <tr key={p.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                    <td className="p-3 text-navy-600">{new Date(p.created_at).toLocaleDateString('de-DE')}</td>
                    <td className="p-3 text-navy-800">{p.description||'Beratung'}</td>
                    <td className="p-3 text-navy-500">{p.payment_method||'Karte'}</td>
                    <td className="p-3 text-right font-medium text-navy-900">{p.amount.toFixed(2)} €</td>
                    <td className="p-3">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          {filtered.length===0 ? <div className="p-8 text-center text-navy-400 text-sm">Keine Coin-Transaktionen</div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100">
                <th className="text-left p-3 text-navy-500">Datum</th>
                <th className="text-left p-3 text-navy-500">Typ</th>
                <th className="text-left p-3 text-navy-500">Beschreibung</th>
                <th className="text-right p-3 text-navy-500">Betrag</th>
              </tr></thead>
              <tbody>
                {(filtered as CoinTx[]).map(t=>(
                  <tr key={t.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                    <td className="p-3 text-navy-600">{new Date(t.created_at).toLocaleDateString('de-DE')}</td>
                    <td className="p-3"><Badge variant={t.amount>0?'success':'warning'}>{t.tx_type}</Badge></td>
                    <td className="p-3 text-navy-700">{t.description||'—'}</td>
                    <td className={`p-3 text-right font-medium ${t.amount>0?'text-green-600':'text-red-600'}`}>{t.amount>0?'+':''}{t.amount} 🪙</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
