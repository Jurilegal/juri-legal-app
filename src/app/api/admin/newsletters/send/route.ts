import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  // Verify admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { newsletterId } = await request.json()
  const { data: newsletter } = await supabase.from('newsletters').select('*').eq('id', newsletterId).single()
  if (!newsletter) return NextResponse.json({ error: 'Newsletter nicht gefunden' }, { status: 404 })

  // Get subscribers based on segment
  let subscriberQuery = supabase.from('profiles').select('id, email').eq('newsletter_subscribed', true)
  if (newsletter.segment === 'b2c') {
    subscriberQuery = subscriberQuery.eq('role', 'mandant')
  } else {
    subscriberQuery = subscriberQuery.eq('role', 'anwalt')
  }
  const { data: subscribers } = await subscriberQuery

  const count = subscribers?.length || 0

  // Replace tracking links in content
  let contentHtml = newsletter.content_html || ''
  contentHtml = contentHtml.replace(/TRACK:([a-zA-Z0-9-]+)/g, (_match: string, linkId: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'https://app-one-tawny-78.vercel.app'}/api/tracking?lid=${linkId}&nid=${newsletterId}`
  })

  // In production: send via Resend/SendGrid/SES
  // For now: mark as sent and log
  console.log(`[NEWSLETTER] Sending "${newsletter.subject}" to ${count} ${newsletter.segment} subscribers`)

  await supabase.from('newsletters').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_count: count,
  }).eq('id', newsletterId)

  return NextResponse.json({ success: true, sentTo: count })
}
