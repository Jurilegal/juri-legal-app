'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface LedgerEntry { id: string; amount: number; reason: string; created_at: string }

const presets = [10, 25, 50, 100]

export default function CoinsPage() {
  const supabase = createClient()
  const [balance, setBalance] = useState(0)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState(25)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('juri_coin_balance').eq('id', user.id).single()
      setBalance(profile?.juri_coin_balance || 0)

      const { data: entries } = await supabase.from('juri_coin_ledger')
        .select('id, amount, reason, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      setLedger((entries || []) as LedgerEntry[])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function topUp() {
    if (amount < 1) return
    setProcessing(true)
    const res = await fetch('/api/mandant/top-up', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url // Redirect to Stripe Checkout
      } else {
        setBalance(prev => prev + amount)
      }
    } else {
      alert('Aufladung fehlgeschlagen. Bitte versuchen Sie es später.')
    }
    setProcessing(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Juri Coins</h2>

      <Card className="p-6 bg-gradient-to-br from-gold-50 to-gold-100 border-gold-200">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🪙</span>
          <div>
            <p className="text-sm text-gold-600">Aktuelles Guthaben</p>
            <p className="text-3xl font-bold text-gold-800">{balance.toFixed(2)} Coins</p>
            <p className="text-xs text-gold-500 mt-1">1 Juri Coin = 1 EUR</p>
          </div>
        </div>
      </Card>

      {/* Top Up */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-4">Guthaben aufladen</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map(p => (
            <button key={p} onClick={() => setAmount(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${amount === p ? 'bg-gold-400 text-white' : 'bg-navy-100 text-navy-500'}`}>
              {p} €
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="number" min="1" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))}
            className="w-28 px-3 py-2 rounded-xl border border-navy-200 text-center text-lg font-bold" />
          <span className="text-navy-400">EUR = {amount} Juri Coins</span>
        </div>
        <Button variant="primary" onClick={topUp} loading={processing}>💳 Jetzt aufladen</Button>
      </Card>

      {/* Ledger */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-4">Transaktionsverlauf</h3>
        {ledger.length === 0 ? (
          <p className="text-navy-400 text-sm">Noch keine Transaktionen.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-navy-800">{e.reason}</p>
                  <p className="text-xs text-navy-400">{new Date(e.created_at).toLocaleString('de-DE')}</p>
                </div>
                <span className={`font-bold ${e.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {e.amount > 0 ? '+' : ''}{e.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
