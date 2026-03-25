import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const linkId = url.searchParams.get('lid')
  const newsletterId = url.searchParams.get('nid')
  const userId = url.searchParams.get('uid')

  if (!linkId) return NextResponse.json({ error: 'Missing lid' }, { status: 400 })

  const supabase = await createClient()

  // Get the affiliate link
  const { data: link } = await supabase.from('affiliate_links').select('url, click_count').eq('id', linkId).single()
  if (!link) return NextResponse.redirect(new URL('/', request.url))

  // Record click
  await supabase.from('affiliate_links').update({ click_count: (link.click_count || 0) + 1 }).eq('id', linkId)

  // Record tracking
  await supabase.from('link_tracking').insert({
    newsletter_id: newsletterId || null,
    user_id: userId || null,
    url: link.url,
    affiliate_link_id: linkId,
  })

  // Redirect to actual URL
  return NextResponse.redirect(link.url)
}

// Webhook for affiliate partner conversions
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { affiliateLinkId, userId, email, amount } = body
  if (!affiliateLinkId) return NextResponse.json({ error: 'affiliateLinkId required' }, { status: 400 })

  // Record conversion
  await supabase.from('affiliate_conversions').insert({
    affiliate_link_id: affiliateLinkId,
    user_id: userId || null,
    email: email || null,
    amount: amount || null,
  })

  // Increment conversion count
  const { data: link } = await supabase.from('affiliate_links').select('conversion_count').eq('id', affiliateLinkId).single()
  if (link) {
    await supabase.from('affiliate_links').update({ conversion_count: (link.conversion_count || 0) + 1 }).eq('id', affiliateLinkId)
  }

  return NextResponse.json({ success: true })
}
