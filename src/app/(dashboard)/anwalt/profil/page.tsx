'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const fachgebiete = [
  'Arbeitsrecht', 'Familienrecht', 'Mietrecht', 'Verkehrsrecht',
  'Strafrecht', 'Erbrecht', 'Vertragsrecht', 'Sozialrecht',
  'Steuerrecht', 'Handelsrecht', 'IT-Recht', 'Medizinrecht',
]

export default function AnwaltProfilPage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [lawyerProfile, setLawyerProfile] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    headline: '', bio: '', city: '', minute_rate: '2.99',
    experience_years: '', specializations: [] as string[],
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: lp } = await supabase.from('lawyer_profiles').select('*').eq('user_id', user.id).single()

      setProfile(p)
      setLawyerProfile(lp)
      if (lp) {
        setForm({
          headline: lp.headline || '',
          bio: lp.bio || '',
          city: lp.city || '',
          minute_rate: lp.minute_rate?.toString() || '2.99',
          experience_years: lp.experience_years?.toString() || '',
          specializations: (lp.specializations as string[]) || [],
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('lawyer_profiles').update({
      headline: form.headline,
      bio: form.bio,
      city: form.city,
      minute_rate: parseFloat(form.minute_rate),
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      specializations: form.specializations,
    }).eq('user_id', user.id)

    setSaving(false)
  }

  function toggleSpec(spec: string) {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter(s => s !== spec)
        : [...f.specializations, spec]
    }))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  const status = (lawyerProfile as Record<string, string>)?.verification_status || 'pending'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-900">Anwaltsprofil bearbeiten</h2>
        <Badge variant={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}>
          {status === 'approved' ? 'Verifiziert' : status === 'rejected' ? 'Abgelehnt' : 'Prüfung ausstehend'}
        </Badge>
      </div>

      <Card className="p-6 space-y-5">
        <Input label="Überschrift / Titel" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="z.B. Fachanwalt für Arbeitsrecht mit 15 Jahren Erfahrung" />
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-navy-700">Über mich</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-white text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all duration-200 resize-none"
            placeholder="Beschreiben Sie Ihre Expertise und Erfahrung..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Stadt" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="z.B. Berlin" />
          <Input label="Minutenpreis (€)" type="number" step="0.01" min="0.99" value={form.minute_rate} onChange={e => setForm(f => ({ ...f, minute_rate: e.target.value }))} />
        </div>

        <Input label="Berufserfahrung (Jahre)" type="number" min="0" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-navy-700">Fachgebiete</label>
          <div className="flex flex-wrap gap-2">
            {fachgebiete.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => toggleSpec(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  form.specializations.includes(f)
                    ? 'bg-gold-400 text-navy-900 shadow-sm'
                    : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving}>Profil speichern</Button>
      </Card>
    </div>
  )
}
