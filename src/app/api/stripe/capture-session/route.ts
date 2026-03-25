import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer, calculateSessionCost, PLATFORM_FEE_PERCENT } from '@/lib/stripe/server'

// Capture actual amount when session ends
export async function POST(request: Request) {
  const stripe = getStripeServer()
  if (!stripe) return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'Session ID fehlt' }, { status: 400 })

  // Get session with payment
  const { data: session } = await supabase
    .from('consultation_sessions')
    .select('*, session_payments(*)')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
  if (session.mandant_id !== user.id && session.anwalt_id !== user.id) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const payments = session.session_payments as unknown as Array<{
    id: string
    stripe_payment_intent_id: string
    minute_rate: number
    status: string
  }>
  const payment = payments?.[0]

  if (!payment || !payment.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'Keine Zahlungsautorisierung gefunden' }, { status: 400 })
  }

  if (payment.status !== 'authorized') {
    return NextResponse.json({ error: 'Zahlung bereits verarbeitet' }, { status: 400 })
  }

  const durationSeconds = session.duration_seconds || 0
  if (durationSeconds <= 0) {
    // Cancel the hold if no duration
    await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
    await supabase.from('session_payments').update({ status: 'cancelled' }).eq('id', payment.id)
    return NextResponse.json({ success: true, captured: 0 })
  }

  const { totalCents, platformFeeCents, minutes } = calculateSessionCost(durationSeconds, payment.minute_rate)

  // Capture the exact amount
  await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
    amount_to_capture: totalCents,
  })

  // Update payment record
  await supabase
    .from('session_payments')
    .update({
      status: 'captured',
      amount_captured: totalCents,
      duration_seconds: durationSeconds,
      platform_fee: platformFeeCents,
    })
    .eq('id', payment.id)

  return NextResponse.json({
    success: true,
    minutes,
    totalCents,
    platformFeeCents,
    anwaltEarningsCents: totalCents - platformFeeCents,
  })
}
