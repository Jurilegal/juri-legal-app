'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function PreisePage() {
  const supabase = createClient()
  const [rateVideo, setRateVideo] = useState(2.5)
  const [rateChat, setRateChat] = useState(1.5)
  const [taxRate, setTaxRate] = useState(19)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('lawyer_profiles').select('minute_rate_video, minute_rate_chat, tax_rate, prices_confirmed_at').eq('user_id', user.id).single()
      if (data) {
        if (data.minute_rate_video) setRateVideo(data.minute_rate_video)
        if (data.minute_rate_chat) setRateChat(data.minute_rate_chat)
        if (data.tax_rate) setTaxRate(data.tax_rate)
        setConfirmedAt(data.prices_confirmed_at)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function calcBreakdown(rate: number) {
    const commission = rate * 0.05
    const net = rate - commission
    const tax = rate * (taxRate / 100)
    const gross = rate + tax
    return { net: net.toFixed(2), commission: commission.toFixed(2), tax: tax.toFixed(2), gross: gross.toFixed(2) }
  }

  async function confirmPrices() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()
    await supabase.from('lawyer_profiles').update({
      minute_rate_video: rateVideo,
      minute_rate_chat: rateChat,
      minute_rate: rateVideo, // also update legacy field
      tax_rate: taxRate,
      prices_confirmed_at: now,
    }).eq('user_id', user.id)

    await supabase.from('price_history').insert({
      user_id: user.id,
      minute_rate_video: rateVideo,
      minute_rate_chat: rateChat,
    })

    setConfirmedAt(now)
    setSaving(false)
    setShowConfirm(false)
  }

  const videoBreakdown = calcBreakdown(rateVideo)
  const chatBreakdown = calcBreakdown(rateChat)

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Preisgestaltung & Rechnungsmodell</h2>

      {confirmedAt && (
        <div className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
          ✓ Preise zuletzt bestätigt am {new Date(confirmedAt).toLocaleString('de-DE')}
        </div>
      )}

      {/* Price Config */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-2">📹 Minutenpreis Videochat</h3>
          <div className="flex items-center gap-2">
            <input type="number" step="0.10" min="0.50" value={rateVideo} onChange={e => setRateVideo(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 rounded-lg border border-navy-200 text-lg font-bold text-navy-900 text-center" />
            <span className="text-navy-400">€ / Min.</span>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-2">💬 Minutenpreis Text-Chat</h3>
          <div className="flex items-center gap-2">
            <input type="number" step="0.10" min="0.50" value={rateChat} onChange={e => setRateChat(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 rounded-lg border border-navy-200 text-lg font-bold text-navy-900 text-center" />
            <span className="text-navy-400">€ / Min.</span>
          </div>
        </Card>
      </div>

      {/* Tax */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-navy-400">USt-Satz:</span>
          <input type="number" step="1" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 px-3 py-1.5 rounded-lg border border-navy-200 text-sm text-center" />
          <span className="text-sm text-navy-400">%</span>
        </div>
      </Card>

      {/* Live Preview */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-4">💡 Live-Rechnungsvorschau (pro Minute)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: '📹 Video', bd: videoBreakdown, rate: rateVideo },
            { label: '💬 Chat', bd: chatBreakdown, rate: rateChat },
          ].map(({ label, bd, rate }) => (
            <div key={label} className="space-y-2">
              <p className="font-medium text-navy-700">{label}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-navy-400">Ihr Anteil</span><span className="font-medium text-emerald-700">{bd.net} €</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Provision (5%)</span><span className="text-navy-600">{bd.commission} €</span></div>
                <div className="flex justify-between"><span className="text-navy-400">USt. ({taxRate}%)</span><span className="text-navy-600">{bd.tax} €</span></div>
                <div className="flex justify-between border-t border-navy-100 pt-1"><span className="font-medium text-navy-700">Mandant zahlt</span><span className="font-bold text-navy-900">{bd.gross} €</span></div>
              </div>
              {/* Visual bar */}
              <div className="h-4 rounded-full overflow-hidden flex">
                <div className="bg-emerald-400" style={{ width: `${(parseFloat(bd.net) / parseFloat(bd.gross)) * 100}%` }} />
                <div className="bg-gold-400" style={{ width: `${(parseFloat(bd.commission) / parseFloat(bd.gross)) * 100}%` }} />
                <div className="bg-navy-300" style={{ width: `${(parseFloat(bd.tax) / parseFloat(bd.gross)) * 100}%` }} />
              </div>
              <div className="flex gap-2 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" />Ihr Anteil</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gold-400" />Provision</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-navy-300" />USt.</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Double Opt-In */}
      <Button variant="primary" onClick={() => setShowConfirm(true)}>Preise und Modell akzeptieren</Button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-navy-800 mb-4">Preise bestätigen</h3>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between p-3 bg-navy-50 rounded-xl">
                <span>📹 Video</span><span className="font-bold">{rateVideo} € / Min.</span>
              </div>
              <div className="flex justify-between p-3 bg-navy-50 rounded-xl">
                <span>💬 Chat</span><span className="font-bold">{rateChat} € / Min.</span>
              </div>
              <div className="flex justify-between p-3 bg-navy-50 rounded-xl">
                <span>USt-Satz</span><span className="font-bold">{taxRate}%</span>
              </div>
              <div className="flex justify-between p-3 bg-gold-50 rounded-xl border border-gold-200">
                <span>Provision</span><span className="font-bold">5%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={confirmPrices} loading={saving}>Ich bin einverstanden und bestätige diese Preise</Button>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Abbrechen</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
