import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe')
  return new Stripe(key)
}

// POST: Create subscription checkout or upgrade
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { action, tier_id } = await request.json()

  if (action === 'upgrade' && tier_id === 'all-in-one') {
    const stripe = getStripe()

    // Check early adopter eligibility
    const { count } = await supabase.from('early_adopters').select('*', { count: 'exact', head: true })
    const isEarlyAdopter = (count || 0) < 500

    if (stripe) {
      // Create Stripe Checkout for subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        line_items: [{ price: process.env.STRIPE_ALLINONE_PRICE_ID || 'price_placeholder', quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app-one-tawny-78.vercel.app'}/anwalt/abo?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app-one-tawny-78.vercel.app'}/anwalt/abo?cancelled=true`,
        metadata: { user_id: user.id, is_early_adopter: String(isEarlyAdopter) },
        ...(isEarlyAdopter ? { subscription_data: { trial_period_days: 365 } } : {}),
      })
      return NextResponse.json({ url: session.url })
    }

    // No Stripe: Create subscription directly in DB
    await supabase.from('subscriptions').upsert({
      user_id: user.id, tier_id: 'all-in-one', status: 'active',
      is_early_adopter: isEarlyAdopter,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (isEarlyAdopter ? 365 : 30) * 86400000).toISOString(),
    }, { onConflict: 'user_id' })

    if (isEarlyAdopter) {
      await supabase.from('early_adopters').insert({ user_id: user.id })
    }

    return NextResponse.json({ ok: true, early_adopter: isEarlyAdopter })
  }

  if (action === 'cancel') {
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
}

// GET: Current subscription status
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data } = await supabase.from('subscriptions').select('*, subscription_tiers(*)').eq('user_id', user.id).single()
  return NextResponse.json({ subscription: data || { tier_id: 'basic', status: 'active' } })
}
