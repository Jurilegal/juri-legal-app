'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { filterContactInfo } from '@/lib/content-filter'

const fachgebiete = [
  'Arbeitsrecht', 'Familienrecht', 'Mietrecht', 'Verkehrsrecht',
  'Strafrecht', 'Erbrecht', 'Vertragsrecht', 'Sozialrecht',
  'Steuerrecht', 'Handelsrecht', 'IT-Recht', 'Medizinrecht',
]

export default function AnwaltProfilPage() {
  const [lawyerProfile, setLawyerProfile] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filterWarning, setFilterWarning] = useState(false)
  const [form, setForm] = useState({
    headline: '', bio: '', city: '', minute_rate: '2.99',
    experience_years: '', graduation_year: '', specializations: [] as string[],
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: lp } = await supabase.from('lawyer_profiles').select('*').eq('user_id', user.id).single()

      setAvatarUrl(p?.avatar_url || null)
      setLawyerProfile(lp)
      if (lp) {
        setForm({
          headline: (lp.headline as string) || '',
          bio: (lp.bio as string) || '',
          city: (lp.city as string) || '',
          minute_rate: lp.minute_rate?.toString() || '2.99',
          experience_years: lp.experience_years?.toString() || '',
          graduation_year: lp.graduation_year?.toString() || '',
          specializations: (lp.specializations as string[]) || [],
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}/profile.${ext}`

    await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUrl(publicUrl + '?t=' + Date.now())
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setFilterWarning(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Apply content filter
    const filteredHeadline = filterContactInfo(form.headline)
    const filteredBio = filterContactInfo(form.bio)
    const wasFiltered = filteredHeadline !== form.headline || filteredBio !== form.bio

    if (wasFiltered) {
      setForm(f => ({ ...f, headline: filteredHeadline, bio: filteredBio }))
      setFilterWarning(true)
    }

    await supabase.from('lawyer_profiles').update({
      headline: filteredHeadline,
      bio: filteredBio,
      city: form.city,
      minute_rate: parseFloat(form.minute_rate),
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      specializations: form.specializations,
    }).eq('user_id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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

      {filterWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          ⚠️ Private Kontaktdaten wurden automatisch durch &quot;J. L.&quot; ersetzt. Bitte überprüfen Sie Ihre Texte.
        </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          ✓ Profil gespeichert.
        </div>
      )}

      {/* Avatar */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Profilbild</h3>
        <p className="text-sm text-navy-400 mb-4">Bitte verwenden Sie ein formelles, berufliches Foto.</p>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-navy-100 overflow-hidden flex items-center justify-center border-2 border-navy-200">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profilbild" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-navy-300">👤</span>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-navy-200 text-sm text-navy-600 cursor-pointer hover:bg-navy-50 transition-colors">
              {uploading ? 'Wird hochgeladen...' : '📷 Bild hochladen'}
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
                onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]) }}
                disabled={uploading} />
            </label>
            <p className="text-xs text-navy-300 mt-2">JPG, PNG oder WebP, max. 5 MB</p>
          </div>
        </div>
      </Card>

      {/* Profile Fields */}
      <Card className="p-6 space-y-5">
        <Input label="Überschrift / Titel" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="z.B. Fachanwalt für Arbeitsrecht mit 15 Jahren Erfahrung" />
        <p className="text-xs text-navy-300 -mt-3">Private Kontaktdaten (Telefon, E-Mail, Kanzleiname) werden automatisch entfernt.</p>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-navy-700">Über mich</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-white text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all duration-200 resize-y"
            placeholder="Beschreiben Sie Ihre Expertise und Erfahrung..."
          />
          <p className="text-xs text-navy-300">Private Kontaktdaten werden automatisch entfernt.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Stadt" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="z.B. Berlin" />
          <Input label="Minutenpreis (€)" type="number" step="0.01" min="0.99" value={form.minute_rate} onChange={e => setForm(f => ({ ...f, minute_rate: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Jahr des Abschlusses" type="number" min="1950" max={new Date().getFullYear()} value={form.graduation_year} onChange={e => setForm(f => ({ ...f, graduation_year: e.target.value }))} placeholder="z.B. 2010" />
          <Input label="Berufserfahrung (Jahre)" type="number" min="0" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} />
        </div>

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
