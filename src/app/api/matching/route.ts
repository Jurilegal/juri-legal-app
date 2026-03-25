import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { query } = await request.json()
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Suchanfrage fehlt' }, { status: 400 })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    // Fallback: text-based search without AI
    const { data: lawyers } = await supabase
      .from('lawyer_profiles')
      .select('user_id, headline, bio, specializations, city, minute_rate, rating, total_reviews, profiles(first_name, last_name, avatar_url)')
      .eq('verification_status', 'approved')
      .limit(10)

    return NextResponse.json({ lawyers: lawyers || [], mode: 'fallback' })
  }

  // Generate embedding for the query
  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    }),
  })

  if (!embRes.ok) {
    return NextResponse.json({ error: 'Embedding-Fehler' }, { status: 500 })
  }

  const embData = await embRes.json()
  const embedding = embData.data[0].embedding

  // Similarity search
  const { data: matches } = await supabase.rpc('match_lawyers', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 10,
  })

  if (!matches || matches.length === 0) {
    return NextResponse.json({ lawyers: [], mode: 'ai' })
  }

  const userIds = matches.map((m: { user_id: string }) => m.user_id)
  const { data: lawyers } = await supabase
    .from('lawyer_profiles')
    .select('user_id, headline, bio, specializations, city, minute_rate, rating, total_reviews, profiles(first_name, last_name, avatar_url)')
    .in('user_id', userIds)

  // Sort by similarity
  const simMap = new Map(matches.map((m: { user_id: string; similarity: number }) => [m.user_id, m.similarity]))
  const sorted = (lawyers || []).sort((a, b) => ((simMap.get(b.user_id) || 0) as number) - ((simMap.get(a.user_id) || 0) as number))

  return NextResponse.json({ lawyers: sorted, mode: 'ai' })
}
