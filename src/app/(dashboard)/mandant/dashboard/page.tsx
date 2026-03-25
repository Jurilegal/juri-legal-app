'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function MandantDashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ sessions: 0, spent: 0, reviews: 0, freeMinutes: 0, coins: 0 })
  const [profileType, setProfileType] = useState<'private' | 'business'>('private')
  const [vatId, setVatId] = useState('')
  const [saving, setSaving] = useState(false)
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { count: sessionCount },
        { count: reviewCount },
        { data: payments },
        { data: freeMinData },
        { data: profile },
      ] = await Promise.all([
        supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('mandant_id', user.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('mandant_id', user.id),
        supabase.from('session_payments').select('amount_captured').eq('mandant_id', user.id).eq('status', 'captured'),
        supabase.rpc('get_free_minutes_balance', { uid: user.id }),
        supabase.from('profiles').select('profile_type, vat_id, juri_coin_balance, newsletter_subscribed').eq('id', user.id).single(),
      ])

      const totalSpent = (payments || []).reduce((s: number, p: { amount_captured: number | null }) => s + (p.amount_captured || 0), 0)

      setStats({
        sessions: sessionCount || 0,
        spent: totalSpent,
        reviews: reviewCount || 0,
        freeMinutes: (freeMinData as unknown as number) || 0,
        coins: profile?.juri_coin_balance || 0,
      })
      setProfileType(profile?.profile_type || 'private')
      setVatId(profile?.vat_id || '')
      setNewsletterSubscribed(profile?.newsletter_subscribed || false)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveProfileType() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      profile_type: profileType,
      vat_id: profileType === 'business' ? vatId : null,
    }).eq('id', user.id)
    setSaving(false)
  }

  async function subscribeNewsletter() {
    setSubscribing(true)
    const res = await fetch('/api/mandant/subscribe-newsletter', { method: 'POST' })
    if (res.ok) {
      setNewsletterSubscribed(true)
    }
    setSubscribing(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      {/* Juri Coins Header Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-200 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="text-sm text-gold-600 font-medium">Juri Coins</p>
            <p className="text-xl font-bold text-gold-800">{stats.coins.toFixed(2)} Coins</p>
          </div>
        </div>
        <Link href="/mandant/coins">
          <Button variant="primary" size="sm">💰 Kredit aufladen</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-navy-400">Beratungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{stats.sessions}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Ausgaben gesamt</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{(stats.spent / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-navy-400">Bewertungen</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{stats.reviews}</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-gold-50 to-gold-100 border-gold-200">
          <p className="text-sm text-gold-600">Freiminuten</p>
          <p className="text-2xl font-bold text-gold-700 mt-1">{stats.freeMinutes} Min.</p>
        </Card>
      </div>

      {/* Profile Type */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Profil-Typ</h3>
        <div className="flex gap-3 mb-4">
          {(['private', 'business'] as const).map(t => (
            <button key={t} onClick={() => setProfileType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${profileType === t ? 'bg-navy-800 text-white' : 'bg-navy-100 text-navy-500'}`}>
              {t === 'private' ? '👤 Privat' : '🏢 Geschäftlich'}
            </button>
          ))}
        </div>
        {profileType === 'business' && (
          <div className="mb-4">
            <label className="text-sm text-navy-400 block mb-1">USt-IdNr.</label>
            <input value={vatId} onChange={e => setVatId(e.target.value)} placeholder="DE123456789"
              className="px-4 py-2 rounded-xl border border-navy-200 text-sm w-64" />
          </div>
        )}
        <Button variant="outline" size="sm" onClick={saveProfileType} loading={saving}>Speichern</Button>
      </Card>

      {/* Newsletter */}
      {!newsletterSubscribed && (
        <Card className="p-6 border-gold-200 bg-gradient-to-r from-gold-50/50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-navy-800">📬 Newsletter abonnieren</h3>
              <p className="text-sm text-navy-400 mt-1">Erhalten Sie <span className="font-bold text-gold-600">20 Juri Coins geschenkt</span> bei Anmeldung!</p>
            </div>
            <Button variant="primary" size="sm" onClick={subscribeNewsletter} loading={subscribing}>Jetzt anmelden</Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Sofort loslegen</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/anwaelte', icon: '🔍', label: 'Anwälte finden' },
            { href: '/mandant/beratungen', icon: '💬', label: 'Beratungen' },
            { href: '/mandant/bewertungen', icon: '⭐', label: 'Bewertungen' },
            { href: '/mandant/zahlungen', icon: '💳', label: 'Zahlungen' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <Card className="p-4 text-center hover:border-gold-300 hover:shadow-md transition-all cursor-pointer">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-xs font-medium text-navy-700 mt-1">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
