'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface PaymentRecord {
  id: string
  session_id: string
  amount_captured: number | null
  minute_rate: number
  duration_seconds: number | null
  platform_fee: number | null
  status: string
  created_at: string
}

const brandIcons: Record<string, string> = {
  visa: '💳 Visa',
  mastercard: '💳 Mastercard',
  amex: '💳 Amex',
}

export default function ZahlungenPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [methodsRes, paymentsRes] = await Promise.all([
      fetch('/api/stripe/payment-methods'),
      fetch('/api/stripe/payments'),
    ])

    if (methodsRes.ok) {
      const data = await methodsRes.json()
      setMethods(data.methods || [])
    }

    if (paymentsRes.ok) {
      const data = await paymentsRes.json()
      setPayments(data.payments || [])
    }
    setLoading(false)
  }

  async function addPaymentMethod() {
    setAdding(true)
    const res = await fetch('/api/stripe/setup-intent', { method: 'POST' })
    if (!res.ok) {
      alert('Stripe ist noch nicht konfiguriert. Bitte versuchen Sie es später.')
      setAdding(false)
      return
    }

    const { clientSecret } = await res.json()
    // In production: open Stripe Elements modal with clientSecret
    // For now, show a placeholder
    alert(`Stripe Setup Intent erstellt. Client Secret: ${clientSecret?.substring(0, 20)}...`)
    setAdding(false)
  }

  async function removeMethod(id: string) {
    if (!confirm('Zahlungsmethode wirklich entfernen?')) return
    await fetch('/api/stripe/payment-methods', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId: id }),
    })
    setMethods(prev => prev.filter(m => m.id !== id))
  }

  const statusLabels: Record<string, string> = {
    authorized: 'Autorisiert',
    captured: 'Abgebucht',
    refunded: 'Erstattet',
    failed: 'Fehlgeschlagen',
    cancelled: 'Storniert',
  }

  if (loading) return <div className="text-center py-12 text-navy-400">Laden...</div>

  return (
    <div className="space-y-8">
      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-navy-800">Zahlungsmethoden</h2>
          <Button variant="primary" size="sm" onClick={addPaymentMethod} loading={adding}>
            + Karte hinzufügen
          </Button>
        </div>

        {methods.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-navy-400">Keine Zahlungsmethode hinterlegt.</p>
            <p className="text-sm text-navy-300 mt-1">Fügen Sie eine Karte hinzu, um Beratungen zu buchen.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {methods.map(m => (
              <Card key={m.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{brandIcons[m.brand] || '💳'}</span>
                  <div>
                    <p className="font-medium text-navy-800">•••• {m.last4}</p>
                    <p className="text-sm text-navy-400">Gültig bis {m.expMonth}/{m.expYear}</p>
                  </div>
                </div>
                <button onClick={() => removeMethod(m.id)} className="text-sm text-red-500 hover:text-red-700 cursor-pointer">
                  Entfernen
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-bold text-navy-800 mb-4">Zahlungsverlauf</h2>
        {payments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-navy-400">Noch keine Zahlungen.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <Card key={p.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy-800">
                      {p.amount_captured ? `${(p.amount_captured / 100).toFixed(2)} €` : 'Ausstehend'}
                    </p>
                    <p className="text-sm text-navy-400">
                      {p.duration_seconds ? `${Math.ceil(p.duration_seconds / 60)} Min.` : ''} &middot;{' '}
                      {(p.minute_rate / 100).toFixed(2)} €/Min. &middot;{' '}
                      {new Date(p.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    p.status === 'captured' ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'authorized' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
