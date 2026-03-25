'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface PendingLawyer {
  user_id: string
  headline: string | null
  city: string | null
  verification_status: string
  created_at: string
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export default function VerifizierungPage() {
  const [lawyers, setLawyers] = useState<PendingLawyer[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('lawyer_profiles')
      .select('user_id, headline, city, verification_status, created_at, profiles(first_name, last_name, email)')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })

    setLawyers((data as unknown as PendingLawyer[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(userId: string, status: 'approved' | 'rejected') {
    const supabase = createClient()
    await supabase.from('lawyer_profiles').update({ verification_status: status }).eq('user_id', userId)
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-900">Ausstehende Verifizierungen</h2>

      {lawyers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-navy-400">Keine ausstehenden Verifizierungen</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {lawyers.map(l => (
            <Card key={l.user_id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-navy-800">
                    {l.profiles?.first_name} {l.profiles?.last_name}
                  </h3>
                  <p className="text-sm text-navy-400">{l.profiles?.email}</p>
                  {l.headline && <p className="text-sm text-navy-500 mt-1">{l.headline}</p>}
                  {l.city && <p className="text-xs text-navy-400 mt-1">📍 {l.city}</p>}
                  <p className="text-xs text-navy-300 mt-2">Registriert: {new Date(l.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Ausstehend</Badge>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button size="sm" onClick={() => handleAction(l.user_id, 'approved')}>
                  ✓ Freischalten
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(l.user_id, 'rejected')}>
                  ✗ Ablehnen
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
