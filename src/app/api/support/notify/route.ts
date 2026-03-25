import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { subject, message } = await request.json()

  // Get user profile
  const { data: profile } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', user.id).single()
  const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()

  // In production: send email via Resend/SendGrid/etc.
  // For now, log and create admin notification
  console.log(`[SUPPORT] From: ${name} (${profile?.email})\nSubject: ${subject}\nMessage: ${message}`)

  // The support_tickets trigger already creates a task in the admin portal
  return NextResponse.json({ success: true })
}
