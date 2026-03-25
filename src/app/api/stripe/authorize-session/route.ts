import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer, PRE_AUTH_MINUTES } from '@/lib/stripe/server'

// Pre-authorize payment when session starts
export async function POST(request: Request) {
  const stripe = getStripeServer()
  if (!stripe) return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'Session ID fehlt' }, { status: 400 })

  // Get session details
  const { data: session } = await supabase
    .from('consultation_sessions')
    .select('*, lawyer_profiles!inner(minute_rate, user_id)')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
  if (session.mandant_id !== user.id) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  // Get mandant's stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Keine Zahlungsmethode hinterlegt' }, { status: 400 })
  }

  // Get default payment method
  const methods = await stripe.paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: 'card',
    limit: 1,
  })

  if (methods.data.length === 0) {
    return NextResponse.json({ error: 'Keine Zahlungsmethode hinterlegt' }, { status: 400 })
  }

  const lawyerProfile = session.lawyer_profiles as unknown as { minute_rate: number; user_id: string }
  const minuteRateCents = Math.round((lawyerProfile.minute_rate || 0) * 100)
  const authAmount = minuteRateCents * PRE_AUTH_MINUTES // Pre-auth for 60 min

  if (authAmount <= 0) {
    return NextResponse.json({ error: 'Ungültiger Minutenpreis' }, { status: 400 })
  }

  // Create PaymentIntent with manual capture (pre-authorization)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: authAmount,
    currency: 'eur',
    customer: profile.stripe_customer_id,
    payment_method: methods.data[0].id,
    capture_method: 'manual',
    confirm: true,
    off_session: true,
    metadata: {
      session_id: sessionId,
      mandant_id: user.id,
      anwalt_id: session.anwalt_id,
      minute_rate_cents: minuteRateCents.toString(),
    },
  })

  // Create payment record
  const { data: payment } = await supabase
    .from('session_payments')
    .insert({
      session_id: sessionId,
      mandant_id: user.id,
      anwalt_id: session.anwalt_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_authorized: authAmount,
      minute_rate: minuteRateCents,
      status: 'authorized',
    })
    .select('id')
    .single()

  // Link payment to session
  if (payment) {
    await supabase
      .from('consultation_sessions')
      .update({ payment_id: payment.id })
      .eq('id', sessionId)
  }

  return NextResponse.json({ success: true, paymentId: payment?.id })
}
