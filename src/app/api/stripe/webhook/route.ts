import { NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/stripe/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  const stripe = getStripeServer()
  if (!stripe) return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 503 })

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook nicht konfiguriert' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      if (pi.metadata?.session_id) {
        await supabaseAdmin
          .from('session_payments')
          .update({ status: 'captured' })
          .eq('stripe_payment_intent_id', pi.id)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      if (pi.metadata?.session_id) {
        await supabaseAdmin
          .from('session_payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id)
      }
      break
    }

    case 'setup_intent.succeeded': {
      const si = event.data.object
      if (si.customer && si.payment_method) {
        const pm = await stripe.paymentMethods.retrieve(si.payment_method as string)
        await supabaseAdmin.from('payment_methods').insert({
          user_id: si.metadata?.supabase_user_id,
          stripe_payment_method_id: pm.id,
          card_brand: pm.card?.brand,
          card_last4: pm.card?.last4,
          is_default: true,
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
