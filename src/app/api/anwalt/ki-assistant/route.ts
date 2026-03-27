import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Du bist ein juristischer KI-Assistent für deutsche Rechtsanwälte. 
Du antwortest ausschließlich auf Deutsch. Du zitierst Gesetze mit §-Zeichen und gibst die Fundstelle an (z.B. § 823 Abs. 1 BGB).
Du bist spezialisiert auf deutsches Recht: BGB, ZPO, StPO, StGB, BRAO, RVG, ArbGG, FamFG, InsO, HGB, GmbHG.
Du gibst keine Rechtsberatung, sondern unterstützt den Anwalt bei Recherche, Formulierung und Analyse.
Formatiere Antworten mit Markdown: **fett**, *kursiv*, Aufzählungen, Überschriften.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Try Groq first, then OpenAI
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!groqKey && !openaiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 503 })
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []).slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  try {
    const apiUrl = groqKey
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'

    const apiKey = groqKey || openaiKey
    const model = groqKey ? 'llama-3.3-70b-versatile' : 'gpt-4o'

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: 'API error', details: err }, { status: 502 })
    }

    const data = await res.json()
    const response = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.'

    return NextResponse.json({ response })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to call AI API', details: String(e) }, { status: 500 })
  }
}
