'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function SessionRequestButton({ anwaltId }: { anwaltId: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRequest() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('consultation_sessions')
      .insert({
        mandant_id: user.id,
        anwalt_id: anwaltId,
        type: 'chat',
      })
      .select('id')
      .single()

    setLoading(false)

    if (error) {
      alert('Fehler beim Senden der Anfrage. Bitte versuchen Sie es erneut.')
      return
    }

    setSent(true)
    setTimeout(() => {
      router.push(`/beratung/${data.id}`)
    }, 1500)
  }

  if (sent) {
    return (
      <div className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        Anfrage gesendet!
      </div>
    )
  }

  return (
    <Button variant="primary" size="lg" loading={loading} onClick={handleRequest}>
      Beratung anfragen
      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    </Button>
  )
}
