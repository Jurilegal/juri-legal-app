'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Newsletter {
  id: string; title: string; subject: string; segment: string
  status: string; template_id: string | null; sent_count: number
  sent_at: string | null; created_at: string
}

const b2cTemplates = Array.from({ length: 12 }, (_, i) => ({
  id: `b2c-${i + 1}`,
  name: `B2C Vorlage ${i + 1}`,
  preview: ['📋 Klassisch', '🎨 Modern', '💼 Business', '🌟 Premium', '📰 News', '🎯 Promo', '💡 Info', '🏛️ Legal', '📊 Report', '🎉 Event', '🔔 Alert', '📝 Update'][i],
}))

const b2bTemplates = Array.from({ length: 12 }, (_, i) => ({
  id: `b2b-${i + 1}`,
  name: `B2B Vorlage ${i + 1}`,
  preview: ['🏢 Corporate', '⚖️ Legal Pro', '📈 Analytics', '🤝 Partner', '💰 Revenue', '📋 Compliance', '🔐 Security', '🎓 Education', '📊 Benchmark', '🌐 Network', '⭐ Spotlight', '📣 Announcement'][i],
}))

export default function NewsletterPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'b2c' | 'b2b'>('b2c')
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)

  // Editor state
  const [editing, setEditing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', subject: '', content: '' })
  const [affiliateBlocks, setAffiliateBlocks] = useState<Array<{ image: string; description: string; linkId: string }>>([])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { loadNewsletters() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadNewsletters() {
    setLoading(true)
    const { data } = await supabase.from('newsletters')
      .select('*').eq('segment', tab).order('created_at', { ascending: false })
    setNewsletters((data || []) as Newsletter[])
    setLoading(false)
  }

  function startEditor(templateId: string) {
    setSelectedTemplate(templateId)
    setEditing(true)
    setForm({ title: '', subject: '', content: '' })
    setAffiliateBlocks([])
  }

  function addAffiliateBlock() {
    setAffiliateBlocks(prev => [...prev, { image: '', description: '', linkId: '' }])
  }

  function removeAffiliateBlock(i: number) {
    setAffiliateBlocks(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAffiliateBlock(i: number, field: string, value: string) {
    setAffiliateBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }

  async function saveNewsletter() {
    setSaving(true)
    const contentHtml = buildHtml(form.content, affiliateBlocks)
    await supabase.from('newsletters').insert({
      title: form.title,
      subject: form.subject,
      content_html: contentHtml,
      template_id: selectedTemplate,
      segment: tab,
      status: 'draft',
    })
    setSaving(false)
    setEditing(false)
    loadNewsletters()
  }

  async function sendNewsletter(id: string) {
    setSending(true)
    await fetch('/api/admin/newsletters/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletterId: id }),
    })
    setSending(false)
    loadNewsletters()
  }

  function buildHtml(content: string, blocks: Array<{ image: string; description: string; linkId: string }>) {
    let html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">`
    html += `<div style="padding:20px;">${content.replace(/\n/g, '<br/>')}</div>`
    if (blocks.length > 0) {
      html += `<hr/><h3 style="padding:0 20px;">Empfehlungen</h3>`
      blocks.forEach(b => {
        html += `<div style="padding:10px 20px;border:1px solid #eee;margin:10px 20px;border-radius:8px;">`
        if (b.image) html += `<img src="${b.image}" alt="" style="max-width:100%;border-radius:4px;"/>`
        html += `<p>${b.description}</p>`
        if (b.linkId) html += `<a href="TRACK:${b.linkId}" style="color:#48D1CC;">Mehr erfahren →</a>`
        html += `</div>`
      })
    }
    html += `</div>`
    return html
  }

  const templates = tab === 'b2c' ? b2cTemplates : b2bTemplates

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Newsletter</h2>
        <div className="flex gap-2">
          {(['b2c', 'b2b'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setEditing(false) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${tab === t ? 'bg-navy-800 text-white' : 'bg-navy-100 text-navy-500'}`}>
              {t === 'b2c' ? '👥 B2C (Mandanten)' : '⚖️ B2B (Anwälte)'}
            </button>
          ))}
        </div>
      </div>

      {!editing ? (
        <>
          {/* Template Selection */}
          <Card className="p-6">
            <h3 className="font-semibold text-navy-800 mb-4">Neuen Newsletter erstellen — Design wählen</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {templates.map(t => (
                <button key={t.id} onClick={() => startEditor(t.id)}
                  className="p-4 rounded-xl border border-navy-200 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer text-center bg-white">
                  <span className="text-3xl block mb-2">{t.preview.split(' ')[0]}</span>
                  <p className="text-xs font-medium text-navy-700">{t.name}</p>
                  <p className="text-[10px] text-navy-400">{t.preview}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Existing Newsletters */}
          <h3 className="font-semibold text-navy-800">Bisherige Newsletter</h3>
          {loading ? (
            <div className="text-center py-8 text-navy-400">Laden...</div>
          ) : newsletters.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-navy-400">Noch keine Newsletter erstellt.</p></Card>
          ) : (
            <div className="space-y-3">
              {newsletters.map(n => (
                <Card key={n.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-800">{n.title}</span>
                        <Badge variant={n.status === 'sent' ? 'success' : n.status === 'scheduled' ? 'warning' : 'neutral'}>
                          {n.status === 'sent' ? 'Versendet' : n.status === 'scheduled' ? 'Geplant' : 'Entwurf'}
                        </Badge>
                      </div>
                      <p className="text-sm text-navy-400 mt-1">
                        Betreff: {n.subject} · {new Date(n.created_at).toLocaleDateString('de-DE')}
                        {n.sent_count > 0 && ` · ${n.sent_count} Empfänger`}
                      </p>
                    </div>
                    {n.status === 'draft' && (
                      <Button variant="primary" size="sm" onClick={() => sendNewsletter(n.id)} loading={sending}>📧 Versenden</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Editor */
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy-800">Newsletter bearbeiten — {selectedTemplate}</h3>
            <button onClick={() => setEditing(false)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-navy-400 block mb-1">Titel (intern)</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm" placeholder="z.B. März Newsletter 2026" />
            </div>
            <div>
              <label className="text-sm text-navy-400 block mb-1">Betreff</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-navy-200 text-sm" placeholder="Betreff der E-Mail" />
            </div>
            <div>
              <label className="text-sm text-navy-400 block mb-1">Inhalt</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={10} className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm resize-y font-mono"
                placeholder="Newsletter-Text (HTML oder Plaintext)..." />
            </div>

            {/* Affiliate Blocks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-navy-700">Affiliate-Produkte (optional)</label>
                <button onClick={addAffiliateBlock} className="text-sm text-gold-600 hover:text-gold-800 cursor-pointer">+ Block hinzufügen</button>
              </div>
              {affiliateBlocks.map((block, i) => (
                <div key={i} className="p-4 bg-navy-50 rounded-xl mb-3 relative">
                  <button onClick={() => removeAffiliateBlock(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 cursor-pointer text-sm">✕</button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input value={block.image} onChange={e => updateAffiliateBlock(i, 'image', e.target.value)}
                      placeholder="Bild-URL" className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
                    <input value={block.description} onChange={e => updateAffiliateBlock(i, 'description', e.target.value)}
                      placeholder="Beschreibung" className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
                    <input value={block.linkId} onChange={e => updateAffiliateBlock(i, 'linkId', e.target.value)}
                      placeholder="Affiliate-Link-ID" className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={saveNewsletter} loading={saving}
                disabled={!form.title.trim() || !form.subject.trim()}>💾 Speichern</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
