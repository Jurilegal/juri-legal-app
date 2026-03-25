'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface DocRequirement { document_type: string; label_de: string; description_de: string; required: boolean }
interface UploadedDoc { id: string; document_type: string; original_filename: string; status: string; file_path: string }

const countryLabels: Record<string, string> = { DE: 'Deutschland', FR: 'Frankreich', IT: 'Italien' }

export default function DokumentePage() {
  const supabase = createClient()
  const [country, setCountry] = useState('DE')
  const [practiceCountries, setPracticeCountries] = useState<string[]>(['DE'])
  const [languages, setLanguages] = useState<string[]>(['Deutsch'])
  const [requirements, setRequirements] = useState<DocRequirement[]>([])
  const [uploaded, setUploaded] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: lawyer } = await supabase.from('lawyer_profiles')
        .select('country_of_practice, countries_of_practice, languages')
        .eq('user_id', user.id).single()

      if (lawyer) {
        setCountry(lawyer.country_of_practice || 'DE')
        setPracticeCountries((lawyer.countries_of_practice as string[]) || ['DE'])
        setLanguages((lawyer.languages as string[]) || ['Deutsch'])
      }

      const { data: docs } = await supabase.from('lawyer_documents')
        .select('id, document_type, original_filename, status, file_path')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      setUploaded((docs || []) as UploadedDoc[])
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function loadReqs() {
      const allCountries = [...new Set([country, ...practiceCountries])]
      const { data } = await supabase.from('country_document_requirements')
        .select('document_type, label_de, description_de, required')
        .in('country_code', allCountries)
      setRequirements((data || []) as DocRequirement[])
    }
    loadReqs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, practiceCountries])

  function togglePracticeCountry(c: string) {
    setPracticeCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function toggleLanguage(l: string) {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }

  async function handleUpload(docType: string, file: File) {
    setUploading(docType)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `documents/${user.id}/${docType}-${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('lawyer-documents').upload(path, file)
    if (uploadError) { alert('Upload fehlgeschlagen: ' + uploadError.message); setUploading(null); return }

    await supabase.from('lawyer_documents').insert({
      user_id: user.id, document_type: docType, file_path: path, original_filename: file.name, status: 'pending_review',
    })

    const { data: docs } = await supabase.from('lawyer_documents')
      .select('id, document_type, original_filename, status, file_path')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setUploaded((docs || []) as UploadedDoc[])
    setUploading(null)
  }

  async function saveSettings() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('lawyer_profiles').update({
      country_of_practice: country,
      countries_of_practice: practiceCountries,
      languages: languages,
    }).eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Dokumente & Zulassung</h2>

      {/* Country Settings */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-4">Standort & Sprachen</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-navy-400 block mb-2">Land des Firmensitzes (Kanzlei)</label>
            <select value={country} onChange={e => setCountry(e.target.value)} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
              {Object.entries(countryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-navy-400 block mb-2">Länder der Berufsausübung</label>
            <div className="flex gap-2">
              {Object.entries(countryLabels).map(([k, v]) => (
                <button key={k} onClick={() => togglePracticeCountry(k)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer ${practiceCountries.includes(k) ? 'bg-gold-50 border-gold-300 text-gold-700' : 'bg-navy-50 border-navy-200 text-navy-400'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-navy-400 block mb-2">Beratungssprachen</label>
            <div className="flex flex-wrap gap-2">
              {['Deutsch', 'Englisch', 'Französisch', 'Italienisch', 'Spanisch', 'Türkisch', 'Arabisch'].map(l => (
                <button key={l} onClick={() => toggleLanguage(l)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer ${languages.includes(l) ? 'bg-gold-50 border-gold-300 text-gold-700' : 'bg-navy-50 border-navy-200 text-navy-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={saveSettings} loading={saving}>Einstellungen speichern</Button>
            {saved && <span className="text-sm text-emerald-600">✓</span>}
          </div>
        </div>
      </Card>

      {/* Document Requirements */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-4">Erforderliche Dokumente</h3>
        <p className="text-sm text-navy-400 mb-4">Basierend auf Ihrem Firmensitz und den Ländern der Berufsausübung benötigen wir folgende Dokumente:</p>
        {requirements.length === 0 ? (
          <p className="text-navy-300 text-sm">Keine Anforderungen für die gewählten Länder.</p>
        ) : (
          <div className="space-y-4">
            {requirements.map(req => {
              const existingDoc = uploaded.find(d => d.document_type === req.document_type)
              return (
                <div key={req.document_type} className="p-4 bg-navy-50 rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-navy-800">{req.label_de}</p>
                        {req.required && <span className="text-xs text-red-500">Pflicht</span>}
                      </div>
                      {req.description_de && <p className="text-xs text-navy-400 mt-1">{req.description_de}</p>}
                    </div>
                    {existingDoc ? (
                      <Badge variant={existingDoc.status === 'approved' ? 'success' : existingDoc.status === 'rejected' ? 'error' : 'warning'}>
                        {existingDoc.status === 'approved' ? 'Genehmigt' : existingDoc.status === 'rejected' ? 'Abgelehnt' : 'In Prüfung'}
                      </Badge>
                    ) : null}
                  </div>
                  {existingDoc ? (
                    <p className="text-xs text-navy-400 mt-2">📎 {existingDoc.original_filename}</p>
                  ) : (
                    <div className="mt-3">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-navy-200 text-sm text-navy-600 cursor-pointer hover:bg-navy-50">
                        {uploading === req.document_type ? 'Wird hochgeladen...' : '📤 Dokument hochladen'}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => { if (e.target.files?.[0]) handleUpload(req.document_type, e.target.files[0]) }}
                          disabled={uploading === req.document_type} />
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
