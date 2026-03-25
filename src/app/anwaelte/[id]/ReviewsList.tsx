'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  mandant_name: string
}

export function ReviewsList({ anwaltId }: { anwaltId: string }) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, mandant_id')
        .eq('anwalt_id', anwaltId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data || data.length === 0) { setLoading(false); return }

      const ids = data.map(r => r.mandant_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', ids)

      const pMap = new Map((profiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]))

      setReviews(data.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        mandant_name: pMap.get(r.mandant_id) || 'Mandant',
      })))
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anwaltId])

  if (loading) return null
  if (reviews.length === 0) return null

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-navy-800 mb-4">Bewertungen</h2>
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="border-b border-navy-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={r.mandant_name} size="sm" />
              <div>
                <p className="text-sm font-medium text-navy-800">{r.mandant_name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-gold-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-navy-400 ml-1">
                    {new Date(r.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            </div>
            {r.comment && <p className="text-sm text-navy-500 ml-11">{r.comment}</p>}
          </div>
        ))}
      </div>
    </Card>
  )
}
