'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function AboPage() {
  const supabase = createClient()
  const [sub, setSub] = useState<{ tier_id: string; status: string; is_early_adopter: boolean; avv_signed_at: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [earlyCount, setEarlyCount] = useState(0)
  const [upgrading, setUpgrading] = useState(false)
  const [showAvv, setShowAvv] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: s } = await supabase.from('subscriptions').select('tier_id,status,is_early_adopter,avv_signed_at').eq('user_id', user.id).single()
      setSub(s)
      const { count } = await supabase.from('early_adopters').select('*', { count: 'exact', head: true })
      setEarlyCount(count || 0)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function upgrade() {
    setUpgrading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const isEarly = earlyCount < 500
    // Create/update subscription
    if (sub) {
      await supabase.from('subscriptions').update({ tier_id: 'all-in-one', avv_signed_at: new Date().toISOString(), is_early_adopter: isEarly }).eq('user_id', user.id)
    } else {
      await supabase.from('subscriptions').insert({ user_id: user.id, tier_id: 'all-in-one', avv_signed_at: new Date().toISOString(), is_early_adopter: isEarly })
    }
    if (isEarly) await supabase.from('early_adopters').insert({ user_id: user.id })
    setSub({ tier_id: 'all-in-one', status: 'active', is_early_adopter: isEarly, avv_signed_at: new Date().toISOString() })
    setShowAvv(false)
    setUpgrading(false)
  }

  async function cancel() {
    if (!confirm('Möchten Sie Ihr All-in-One Abo wirklich kündigen?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('subscriptions').update({ tier_id: 'basic', status: 'cancelled' }).eq('user_id', user.id)
    setSub(s => s ? { ...s, tier_id: 'basic', status: 'cancelled' } : null)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  const isAllInOne = sub?.tier_id === 'all-in-one'
  const spotsLeft = Math.max(0, 500 - earlyCount)

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Abonnement verwalten</h2>

      {/* Current Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy-800">Aktueller Plan</h3>
            <p className="text-2xl font-bold text-navy-900 mt-1">{isAllInOne ? 'JuriLegal All-in-One' : 'JuriLegal Basic'}</p>
            {isAllInOne && sub?.is_early_adopter && <Badge variant="success">Early Adopter — 12 Monate kostenlos</Badge>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-navy-900">{isAllInOne ? (sub?.is_early_adopter ? '0' : '149') : '0'} €</p>
            <p className="text-sm text-navy-400">/ Monat</p>
          </div>
        </div>
      </Card>

      {!isAllInOne ? (
        <>
          {/* Early Adopter Banner */}
          {spotsLeft > 0 && (
            <Card className="p-6 border-gold-200 bg-gradient-to-r from-gold-50 to-white">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🎁</span>
                <div>
                  <h3 className="font-bold text-navy-800">Early-Adopter-Angebot</h3>
                  <p className="text-sm text-navy-500">Die ersten 500 Anwälte erhalten All-in-One <span className="font-bold text-gold-600">12 Monate kostenlos</span>!</p>
                  <p className="text-xs text-gold-500 mt-1">Noch {spotsLeft} Plätze verfügbar</p>
                </div>
              </div>
            </Card>
          )}

          {/* Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-6 border-navy-200">
              <h4 className="font-bold text-navy-800 mb-3">Basic (kostenlos)</h4>
              <ul className="space-y-2 text-sm text-navy-500">
                <li>✅ Marktplatz-Beratungen</li>
                <li>✅ Profil & Bewertungen</li>
                <li>✅ Einnahmen-Dashboard</li>
                <li className="text-navy-300">❌ Digitale Aktenführung</li>
                <li className="text-navy-300">❌ Fristen & Aufgaben</li>
                <li className="text-navy-300">❌ Juristische Datenbank</li>
                <li className="text-navy-300">❌ beA-Integration</li>
                <li className="text-navy-300">❌ DATEV-Export</li>
              </ul>
            </Card>
            <Card className="p-6 border-gold-300 bg-gold-50/30">
              <h4 className="font-bold text-navy-800 mb-3">All-in-One (149 €/Mo.)</h4>
              <ul className="space-y-2 text-sm text-navy-500">
                <li>✅ Alles aus Basic</li>
                <li>✅ Digitale Aktenführung & DMS</li>
                <li>✅ Fristen- & Aufgabenkalender</li>
                <li>✅ Zeiterfassung & RVG-Abrechnung</li>
                <li>✅ Juristische Datenbank (juris)</li>
                <li>✅ beA-Postfach</li>
                <li>✅ DATEV-Export</li>
                <li>✅ Migrations-Wizard</li>
              </ul>
              <Button variant="primary" className="mt-4 w-full" onClick={() => setShowAvv(true)}>Jetzt upgraden</Button>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <Card className="p-5"><p className="text-sm text-navy-500">✅ Digitale Aktenführung & DMS</p></Card>
          <Card className="p-5"><p className="text-sm text-navy-500">✅ Fristen- & Aufgabenkalender</p></Card>
          <Card className="p-5"><p className="text-sm text-navy-500">✅ Zeiterfassung & Abrechnung</p></Card>
          <Card className="p-5"><p className="text-sm text-navy-500">✅ Juristische Datenbank</p></Card>
          <Card className="p-5"><p className="text-sm text-navy-500">✅ beA-Postfach</p></Card>
          <Card className="p-5"><p className="text-sm text-navy-500">✅ DATEV-Export</p></Card>
          <Button variant="outline" onClick={cancel}>Abo kündigen</Button>
        </div>
      )}

      <p className="text-xs text-navy-300 text-center">Alle Ihre Kanzleidaten werden ausschließlich auf ISO 27001-zertifizierten Servern in Frankfurt am Main, Deutschland, gespeichert und verarbeitet.</p>

      {/* AVV Modal */}
      {showAvv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-navy-800 mb-4">Auftragsverarbeitungsvertrag (AVV)</h3>
            <div className="text-sm text-navy-500 space-y-3 mb-6">
              <p>Zwischen Ihnen (Auftraggeber) und JuriLegal GmbH (Auftragsverarbeiter) wird folgender AVV geschlossen:</p>
              <p><strong>§ 1 Gegenstand:</strong> JuriLegal verarbeitet personenbezogene Daten Ihrer Mandanten im Rahmen der All-in-One Kanzleisoftware ausschließlich nach Ihrer Weisung.</p>
              <p><strong>§ 2 Dauer:</strong> Der AVV gilt für die Dauer des All-in-One Abonnements.</p>
              <p><strong>§ 3 Art der Daten:</strong> Mandantenstammdaten, Akteninhalte, Kommunikation, Dokumente, Abrechnungsdaten.</p>
              <p><strong>§ 4 Technische Maßnahmen:</strong> End-to-End-Verschlüsselung, ISO 27001-zertifizierte Server in Frankfurt/Main, strikte Mandantentrennung, regelmäßige Penetrationstests.</p>
              <p><strong>§ 5 Unterauftragnehmer:</strong> Supabase (EU-West, DSGVO-konform), Vercel (Edge, EU-Routing).</p>
              <p><strong>§ 6 Löschung:</strong> Nach Vertragsende werden alle Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={upgrade} loading={upgrading}>Ich stimme zu und unterschreibe digital</Button>
              <Button variant="outline" onClick={() => setShowAvv(false)}>Abbrechen</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
