import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { amount } = await request.json()
  if (!amount || amount < 1) return NextResponse.json({ error: 'Mindestbetrag: 1 EUR' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()

  try {
    // Create Stripe Checkout Session
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: profile?.email, metadata: { user_id: user.id } })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(amount * 100),
          product_data: { name: `${amount} Juri Coins` },
        },
        quantity: 1,
      }],
      metadata: { user_id: user.id, coins: String(amount), type: 'coin_topup' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app-one-tawny-78.vercel.app'}/mandant/coins?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app-one-tawny-78.vercel.app'}/mandant/coins`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe top-up error:', error)
    return NextResponse.json({ error: 'Stripe-Fehler' }, { status: 500 })
  }
}
