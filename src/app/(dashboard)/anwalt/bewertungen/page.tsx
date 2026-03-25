'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

interface Review {
  id: string; rating: number; comment: string | null; created_at: string; mandant_name: string
  deletion_requested: boolean
}

export default function BewertungenPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [stats, setStats] = useState({ avg: 0, count: 0 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: lawyer } = await supabase.from('lawyer_profiles').select('rating, total_reviews').eq('user_id', user.id).single()
      setStats({ avg: lawyer?.rating || 0, count: lawyer?.total_reviews || 0 })

      const { data } = await supabase.from('reviews').select('id, rating, comment, created_at, mandant_id').eq('anwalt_id', user.id).order('created_at', { ascending: false })
      if (!data?.length) { setLoading(false); return }

      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', data.map(r => r.mandant_id))
      const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`]))

      const { data: delReqs } = await supabase.from('review_deletion_requests').select('review_id').eq('anwalt_id', user.id).eq('status', 'pending')
      const delSet = new Set((delReqs || []).map(d => d.review_id))

      setReviews(data.map(r => ({
        id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
        mandant_name: pMap.get(r.mandant_id) || 'Mandant',
        deletion_requested: delSet.has(r.id),
      })))
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function requestDeletion(reviewId: string) {
    if (!deleteReason.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('review_deletion_requests').insert({
      review_id: reviewId,
      anwalt_id: user.id,
      reason: deleteReason,
    })

    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, deletion_requested: true } : r))
    setDeleteModal(null)
    setDeleteReason('')
  }

  if (loading) return <div className="text-center py-12 text-navy-400">Laden...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Meine Bewertungen</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 text-center">
          <p className="text-4xl font-bold text-gold-500">{stats.avg > 0 ? stats.avg : '–'} <span className="text-2xl">★</span></p>
          <p className="text-sm text-navy-400 mt-1">Durchschnitt</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-4xl font-bold text-navy-900">{stats.count}</p>
          <p className="text-sm text-navy-400 mt-1">Bewertungen gesamt</p>
        </Card>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Noch keine Bewertungen erhalten.</p></Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={r.mandant_name} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-navy-800">{r.mandant_name}</span>
                      <span className="text-gold-400 ml-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <span className="text-xs text-navy-400">{new Date(r.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  {r.comment && <p className="text-sm text-navy-500 mt-2">{r.comment}</p>}
                  <div className="mt-3">
                    {r.deletion_requested ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Löschantrag eingereicht</span>
                    ) : (
                      <button onClick={() => setDeleteModal(r.id)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer">Löschung beantragen</button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-navy-800 mb-3">Löschung beantragen</h3>
            <p className="text-sm text-navy-400 mb-3">Bitte begründen Sie, warum diese Bewertung gelöscht werden soll. Ein Admin wird den Antrag prüfen.</p>
            <textarea
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Begründung (Pflicht)..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm resize-y mb-3"
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => requestDeletion(deleteModal)} disabled={!deleteReason.trim()}>Antrag senden</Button>
              <Button variant="outline" size="sm" onClick={() => { setDeleteModal(null); setDeleteReason('') }}>Abbrechen</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
