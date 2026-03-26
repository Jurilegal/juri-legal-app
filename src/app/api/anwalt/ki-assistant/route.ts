import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { messages } = await request.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ reply: '⚠️ OpenAI API-Key nicht konfiguriert. Bitte OPENAI_API_KEY in den Umgebungsvariablen hinterlegen.' })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Du bist ein juristischer KI-Assistent für deutsche Anwälte. Antworte präzise, strukturiert und mit Bezug auf deutsches Recht. Zitiere relevante Paragraphen und Rechtsprechung wenn möglich. Antworte auf Deutsch.' },
          ...messages,
        ],
        max_tokens: 2000,
      }),
    })
    const data = await res.json()
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.' })
  } catch {
    return NextResponse.json({ reply: 'Fehler bei der Verbindung zum KI-Service.' }, { status: 500 })
  }
}
