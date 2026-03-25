import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  // Check if already subscribed
  const { data: profile } = await supabase.from('profiles').select('newsletter_subscribed, juri_coin_balance').eq('id', user.id).single()
  if (profile?.newsletter_subscribed) {
    return NextResponse.json({ error: 'Bereits abonniert' }, { status: 400 })
  }

  // Subscribe + grant 20 Juri Coins
  const newBalance = (profile?.juri_coin_balance || 0) + 20
  await supabase.from('profiles').update({
    newsletter_subscribed: true,
    newsletter_confirmed_at: new Date().toISOString(),
    juri_coin_balance: newBalance,
  }).eq('id', user.id)

  // Ledger entry
  await supabase.from('juri_coin_ledger').insert({
    user_id: user.id,
    amount: 20,
    reason: 'Newsletter-Anmeldung Bonus',
  })

  return NextResponse.json({ success: true, newBalance })
}
