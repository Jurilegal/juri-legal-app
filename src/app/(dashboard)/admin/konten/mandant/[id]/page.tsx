'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'

export default function MandantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([])
  const [payments, setPayments] = useState<Record<string, unknown>[]>([])
  const [freeMinutes, setFreeMinutes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [profRes, sessRes, payRes, fmRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('consultation_sessions').select('*').eq('mandant_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('session_payments').select('*').eq('mandant_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.rpc('get_free_minutes_balance', { uid: id }),
      ])
      setProfile(profRes.data)
      setSessions(sessRes.data || [])
      setPayments(payRes.data || [])
      setFreeMinutes((fmRes.data as unknown as number) || 0)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <div className="text-center py-12 text-navy-400">Laden...</div>
  if (!profile) return <div className="text-center py-12 text-navy-400">Nicht gefunden.</div>

  const p = profile
  const fullName = `${p.first_name || ''} ${p.last_name || ''}`
  const totalSpent = payments.reduce((s, pay) => s + ((pay.amount_captured as number) || 0), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/konten" className="text-sm text-navy-400 hover:text-navy-600">← Zurück</Link>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar name={fullName} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{fullName}</h1>
            <p className="text-navy-400">{p.email as string}</p>
            {p.phone ? <p className="text-sm text-navy-400">📞 {p.phone as string}</p> : null}
            <p className="text-sm text-navy-300 mt-1">Registriert: {new Date(p.created_at as string).toLocaleDateString('de-DE')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-navy-400">Beratungen</p>
          <p className="text-2xl font-bold text-navy-900">{sessions.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-navy-400">Ausgaben</p>
          <p className="text-2xl font-bold text-navy-900">{(totalSpent / 100).toFixed(2)} €</p>
        </Card>
        <Card className="p-5 bg-gold-50 border-gold-200">
          <p className="text-sm text-gold-600">Freiminuten</p>
          <p className="text-2xl font-bold text-gold-700">{freeMinutes}</p>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Zahlungshistorie</h2>
        {payments.length === 0 ? (
          <p className="text-navy-400 text-sm">Keine Zahlungen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-navy-400 border-b border-navy-100">
                  <th className="pb-2">Datum</th>
                  <th className="pb-2">Dauer</th>
                  <th className="pb-2">Betrag</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(pay => (
                  <tr key={pay.id as string} className="border-b border-navy-50">
                    <td className="py-2 text-navy-800">{new Date(pay.created_at as string).toLocaleDateString('de-DE')}</td>
                    <td className="py-2 text-navy-600">{pay.duration_seconds ? `${Math.ceil(pay.duration_seconds as number / 60)} Min.` : '–'}</td>
                    <td className="py-2 font-medium text-navy-800">{pay.amount_captured ? `${((pay.amount_captured as number) / 100).toFixed(2)} €` : '–'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${pay.status === 'captured' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {pay.status as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Sessions */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Beratungen</h2>
        {sessions.length === 0 ? (
          <p className="text-navy-400 text-sm">Keine Beratungen.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id as string} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl text-sm">
                <span className="text-navy-800">{new Date(s.created_at as string).toLocaleDateString('de-DE')} {s.type === 'chat' ? '💬' : '📹'}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-100 text-navy-500'}`}>
                  {s.status as string}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
