'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function ReviewForm({ sessionId, anwaltId, existingReview }: {
  sessionId: string
  anwaltId: string
  existingReview?: { rating: number; comment: string | null } | null
}) {
  const supabase = createClient()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [submitted, setSubmitted] = useState(!!existingReview)
  const [loading, setLoading] = useState(false)
  const [hover, setHover] = useState(0)

  async function handleSubmit() {
    if (rating === 0) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('reviews').insert({
      session_id: sessionId,
      mandant_id: user.id,
      anwalt_id: anwaltId,
      rating,
      comment: comment.trim() || null,
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <Card className="p-5 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">✓</span>
          <p className="text-sm font-medium text-emerald-700">
            Bewertung abgegeben: {'★'.repeat(existingReview?.rating || rating)}{'☆'.repeat(5 - (existingReview?.rating || rating))}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-navy-800 mb-3">Bewertung abgeben</h3>

      {/* Stars */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl cursor-pointer transition-transform hover:scale-110"
          >
            {star <= (hover || rating)
              ? <span className="text-gold-400">★</span>
              : <span className="text-navy-200">☆</span>
            }
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Kommentar (optional)..."
        rows={3}
        className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm text-navy-800 resize-y focus:outline-none focus:ring-2 focus:ring-gold-400"
      />

      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        loading={loading}
        disabled={rating === 0}
        className="mt-3"
      >
        Bewertung abgeben
      </Button>
    </Card>
  )
}
