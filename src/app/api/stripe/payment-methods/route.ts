import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe/server'

export async function GET() {
  const stripe = getStripeServer()
  if (!stripe) return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) return NextResponse.json({ methods: [] })

  const methods = await stripe.paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: 'card',
  })

  return NextResponse.json({
    methods: methods.data.map(m => ({
      id: m.id,
      brand: m.card?.brand,
      last4: m.card?.last4,
      expMonth: m.card?.exp_month,
      expYear: m.card?.exp_year,
    })),
  })
}

export async function DELETE(request: Request) {
  const stripe = getStripeServer()
  if (!stripe) return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { paymentMethodId } = await request.json()
  if (!paymentMethodId) return NextResponse.json({ error: 'Fehlende ID' }, { status: 400 })

  await stripe.paymentMethods.detach(paymentMethodId)
  return NextResponse.json({ success: true })
}
