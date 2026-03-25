import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Re-index all lawyer profiles (admin only)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return NextResponse.json({ error: 'OpenAI API Key nicht konfiguriert' }, { status: 503 })
  }

  const { data: lawyers } = await supabaseAdmin
    .from('lawyer_profiles')
    .select('user_id, headline, bio, specializations, city, profiles(first_name, last_name)')
    .eq('verification_status', 'approved')

  if (!lawyers || lawyers.length === 0) {
    return NextResponse.json({ indexed: 0 })
  }

  let indexed = 0
  for (const lawyer of lawyers) {
    const profile = lawyer.profiles as unknown as { first_name: string; last_name: string }
    const text = [
      `${profile?.first_name || ''} ${profile?.last_name || ''}`,
      lawyer.headline || '',
      lawyer.bio || '',
      (lawyer.specializations as string[])?.join(', ') || '',
      lawyer.city || '',
    ].filter(Boolean).join('. ')

    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    })

    if (!embRes.ok) continue

    const embData = await embRes.json()
    const embedding = embData.data[0].embedding

    await supabaseAdmin
      .from('lawyer_profiles')
      .update({ embedding })
      .eq('user_id', lawyer.user_id)

    indexed++
  }

  return NextResponse.json({ indexed })
}
