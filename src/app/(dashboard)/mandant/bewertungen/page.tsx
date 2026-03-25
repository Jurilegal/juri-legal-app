'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Review {
  id: string; session_id: string; anwalt_name: string; rating: number; comment: string | null; created_at: string
}

interface UnreviewedSession {
  id: string; anwalt_id: string; anwalt_name: string; ended_at: string
}

export default function MandantBewertungenPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [unreviewed, setUnreviewed] = useState<UnreviewedSession[]>([])
  const [loading, setLoading] = useState(true)

  // Review modal
  const [reviewModal, setReviewModal] = useState<UnreviewedSession | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Existing reviews
    const { data: revData } = await supabase.from('reviews')
      .select('id, session_id, anwalt_id, rating, comment, created_at')
      .eq('mandant_id', user.id).order('created_at', { ascending: false })

    const reviewedSessionIds = new Set((revData || []).map(r => r.session_id))

    // Completed sessions without reviews
    const { data: sessData } = await supabase.from('consultation_sessions')
      .select('id, anwalt_id, ended_at')
      .eq('mandant_id', user.id).eq('status', 'completed')
      .order('ended_at', { ascending: false })

    const allAnwaltIds = [...new Set([
      ...(revData || []).map(r => r.anwalt_id),
      ...(sessData || []).map(s => s.anwalt_id),
    ])]

    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', allAnwaltIds)
    const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]))

    setReviews((revData || []).map(r => ({
      ...r, anwalt_name: pMap.get(r.anwalt_id) || 'Anwalt',
    })))

    setUnreviewed((sessData || []).filter(s => !reviewedSessionIds.has(s.id)).map(s => ({
      ...s, anwalt_name: pMap.get(s.anwalt_id) || 'Anwalt',
    })))

    setLoading(false)
  }

  async function submitReview() {
    if (!reviewModal || rating === 0) return
    if (rating < 3 && !comment.trim()) return // Required text for < 3 stars
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('reviews').insert({
      session_id: reviewModal.id,
      mandant_id: user.id,
      anwalt_id: reviewModal.anwalt_id,
      rating,
      comment: comment || null,
    })

    setReviewModal(null); setRating(0); setComment('')
    setSubmitting(false)
    loadAll()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Meine Bewertungen</h2>

      {/* Unreviewed Sessions */}
      {unreviewed.length > 0 && (
        <Card className="p-6 border-gold-200 bg-gold-50/50">
          <h3 className="font-semibold text-navy-800 mb-3">⭐ Noch nicht bewertet</h3>
          <div className="space-y-2">
            {unreviewed.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-navy-100">
                <div>
                  <p className="font-medium text-navy-800">{s.anwalt_name}</p>
                  <p className="text-xs text-navy-400">{new Date(s.ended_at).toLocaleDateString('de-DE')}</p>
                </div>
                <button onClick={() => setReviewModal(s)} className="text-sm px-3 py-1.5 rounded-lg bg-gold-100 text-gold-700 border border-gold-200 cursor-pointer hover:bg-gold-200">
                  Bewertung abgeben
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Existing Reviews */}
      {reviews.length === 0 && unreviewed.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Noch keine Bewertungen abgegeben.</p></Card>
      ) : reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-navy-800">{r.anwalt_name}</p>
                  <p className="text-gold-400 mt-1">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                  {r.comment && <p className="text-sm text-navy-500 mt-2">{r.comment}</p>}
                </div>
                <span className="text-xs text-navy-400">{new Date(r.created_at).toLocaleDateString('de-DE')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-bold text-navy-800 mb-1">Bewertung für {reviewModal.anwalt_name}</h3>
            <p className="text-sm text-navy-400 mb-4">{new Date(reviewModal.ended_at).toLocaleDateString('de-DE')}</p>

            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)}
                  className={`text-3xl cursor-pointer transition-colors ${star <= rating ? 'text-gold-400' : 'text-navy-200 hover:text-gold-300'}`}>
                  ★
                </button>
              ))}
            </div>

            {rating > 0 && rating < 3 && (
              <p className="text-xs text-red-500 mb-2">Bei weniger als 3 Sternen ist ein Kommentar Pflicht.</p>
            )}

            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder={rating < 3 && rating > 0 ? 'Kommentar (Pflicht bei < 3 Sternen) *' : 'Optionaler Kommentar...'}
              rows={3} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm resize-y mb-4" />

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={submitReview} loading={submitting}
                disabled={rating === 0 || (rating < 3 && !comment.trim())}>Bewertung abgeben</Button>
              <Button variant="outline" size="sm" onClick={() => { setReviewModal(null); setRating(0); setComment('') }}>Abbrechen</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
