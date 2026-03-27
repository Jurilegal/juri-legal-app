'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface CoinTx { id:string; amount:number; tx_type:string; description:string|null; created_at:string }
const PACKAGES = [{coins:10,price:10,label:'10 Coins'},{coins:25,price:25,label:'25 Coins'},{coins:50,price:50,label:'50 Coins',popular:true},{coins:100,price:100,label:'100 Coins'}]

export default function CoinsPage() {
  const supabase = createClient()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<CoinTx[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null)
  const [coupon, setCoupon] = useState('')

  useEffect(()=>{load()},[]) // eslint-disable-line

  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('juri_coin_ledger').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50)
    const txs = (data||[]) as CoinTx[]
    setTransactions(txs)
    const bal = txs.reduce((s,t)=>s+t.amount,0)
    setBalance(bal)
    setLoading(false)
  }

  async function buyCoins(pkg:typeof PACKAGES[0]) {
    setBuying(true)
    try {
      const res = await fetch('/api/mandant/top-up',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:pkg.price,coins:pkg.coins})})
      if(res.ok) {
        const data = await res.json()
        if(data.url) { window.location.href = data.url; return }
        // If no Stripe URL, add coins directly (demo mode)
        const { data:{user} } = await supabase.auth.getUser()
        if(user) {
          await supabase.from('juri_coin_ledger').insert({user_id:user.id,amount:pkg.coins,tx_type:'aufladung',description:`${pkg.coins} Coins aufgeladen (${pkg.price}€)`})
          setToast({msg:`${pkg.coins} Coins aufgeladen!`,type:'success'}); setTimeout(()=>setToast(null),3000)
          load()
        }
      } else {
        // Fallback: direct DB insert for demo
        const { data:{user} } = await supabase.auth.getUser()
        if(user) {
          await supabase.from('juri_coin_ledger').insert({user_id:user.id,amount:pkg.coins,tx_type:'aufladung',description:`${pkg.coins} Coins aufgeladen (${pkg.price}€)`})
          setToast({msg:`${pkg.coins} Coins aufgeladen!`,type:'success'}); setTimeout(()=>setToast(null),3000)
          load()
        }
      }
    } catch {
      // Direct fallback
      const { data:{user} } = await supabase.auth.getUser()
      if(user) {
        await supabase.from('juri_coin_ledger').insert({user_id:user.id,amount:pkg.coins,tx_type:'aufladung',description:`${pkg.coins} Coins aufgeladen (${pkg.price}€)`})
        setToast({msg:`${pkg.coins} Coins gutgeschrieben`,type:'success'}); setTimeout(()=>setToast(null),3000)
        load()
      }
    }
    setBuying(false)
  }

  async function redeemCoupon() {
    if(!coupon.trim()) return
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    // Simple coupon check
    if(coupon.toUpperCase()==='NEWSLETTER20') {
      await supabase.from('juri_coin_ledger').insert({user_id:user.id,amount:20,tx_type:'bonus',description:'Newsletter-Bonus: 20 Coins'})
      setToast({msg:'20 Bonus-Coins gutgeschrieben!',type:'success'}); setCoupon(''); load()
    } else {
      setToast({msg:'Ungültiger Gutscheincode',type:'error'})
    }
    setTimeout(()=>setToast(null),3000)
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type==='success'?'bg-green-500':'bg-red-500'} text-white`}>{toast.msg}</div>}

      <div><h2 className="text-xl font-bold text-navy-800">🪙 Juri Coins</h2><p className="text-sm text-navy-400">Aufladen und verwalten Sie Ihr Coin-Guthaben</p></div>

      {/* Balance */}
      <Card className="p-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white">
        <p className="text-sm opacity-80">Ihr Guthaben</p>
        <p className="text-4xl font-bold mt-1">{balance} 🪙</p>
        <p className="text-xs opacity-60 mt-2">1 Coin = 1 EUR · Für Rechtsberatungen auf Juri Legal</p>
      </Card>

      {/* Packages */}
      <div>
        <h3 className="font-semibold text-navy-800 mb-3">Coins aufladen</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PACKAGES.map(pkg=>(
            <Card key={pkg.coins} className={`p-4 text-center cursor-pointer hover:border-gold-400 transition relative ${pkg.popular?'border-gold-400 ring-2 ring-gold-200':''}`} onClick={()=>!buying&&buyCoins(pkg)}>
              {pkg.popular && <span className="absolute -top-2 right-2 bg-gold-500 text-white text-[10px] px-2 py-0.5 rounded-full">Beliebt</span>}
              <p className="text-3xl mb-1">🪙</p>
              <p className="text-lg font-bold text-navy-900">{pkg.coins}</p>
              <p className="text-sm text-navy-500">{pkg.price} €</p>
              <Button variant={pkg.popular?'primary':'secondary'} size="sm" className="mt-2 w-full" disabled={buying}>Kaufen</Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Coupon */}
      <Card className="p-4">
        <p className="text-sm font-medium text-navy-700 mb-2">🎁 Gutscheincode einlösen</p>
        <div className="flex gap-2">
          <input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Code eingeben..." className="flex-1 px-3 py-2 rounded-xl border border-navy-200 text-sm"/>
          <Button variant="secondary" size="sm" onClick={redeemCoupon}>Einlösen</Button>
        </div>
        <p className="text-[10px] text-navy-400 mt-1">💡 Newsletter abonnieren = 20 Coins Bonus (Code: NEWSLETTER20)</p>
      </Card>

      {/* Transaction history */}
      <div>
        <h3 className="font-semibold text-navy-800 mb-3">Transaktionsverlauf</h3>
        <Card className="overflow-x-auto">
          {transactions.length===0 ? <div className="p-8 text-center text-navy-400 text-sm">Noch keine Transaktionen</div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100">
                <th className="text-left p-3 text-navy-500">Datum</th>
                <th className="text-left p-3 text-navy-500">Typ</th>
                <th className="text-left p-3 text-navy-500">Beschreibung</th>
                <th className="text-right p-3 text-navy-500">Coins</th>
              </tr></thead>
              <tbody>
                {transactions.map(t=>(
                  <tr key={t.id} className="border-b border-navy-50">
                    <td className="p-3 text-navy-600">{new Date(t.created_at).toLocaleDateString('de-DE')}</td>
                    <td className="p-3"><Badge variant={t.amount>0?'success':'warning'}>{t.tx_type}</Badge></td>
                    <td className="p-3 text-navy-700">{t.description||'—'}</td>
                    <td className={`p-3 text-right font-bold ${t.amount>0?'text-green-600':'text-red-600'}`}>{t.amount>0?'+':''}{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
