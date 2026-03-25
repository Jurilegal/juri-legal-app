'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AffiliateLink {
  id: string; name: string; url: string; product_image: string | null
  product_description: string | null; partner: string | null
  click_count: number; conversion_count: number; created_at: string
}

interface Conversion {
  id: string; email: string | null; amount: number | null; created_at: string
  affiliate_link_id: string
}

export default function AffiliatesPage() {
  const supabase = createClient()
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', product_image: '', product_description: '', partner: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)
    const [{ data: linksData }, { data: convData }] = await Promise.all([
      supabase.from('affiliate_links').select('*').order('created_at', { ascending: false }),
      supabase.from('affiliate_conversions').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setLinks((linksData || []) as AffiliateLink[])
    setConversions((convData || []) as Conversion[])
    setLoading(false)
  }

  async function createLink() {
    if (!form.name.trim() || !form.url.trim()) return
    setSaving(true)
    await supabase.from('affiliate_links').insert({
      name: form.name, url: form.url,
      product_image: form.product_image || null,
      product_description: form.product_description || null,
      partner: form.partner || null,
    })
    setForm({ name: '', url: '', product_image: '', product_description: '', partner: '' })
    setShowForm(false)
    setSaving(false)
    loadAll()
  }

  async function deleteLink(id: string) {
    if (!confirm('Affiliate-Link wirklich löschen?')) return
    await supabase.from('affiliate_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" /></div>

  const totalClicks = links.reduce((s, l) => s + l.click_count, 0)
  const totalConversions = links.reduce((s, l) => s + l.conversion_count, 0)
  const totalRevenue = conversions.reduce((s, c) => s + (c.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Affiliate Links</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Neuer Link'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-sm text-navy-400">Klicks gesamt</p><p className="text-2xl font-bold text-navy-900">{totalClicks}</p></Card>
        <Card className="p-5"><p className="text-sm text-navy-400">Conversions</p><p className="text-2xl font-bold text-emerald-600">{totalConversions}</p></Card>
        <Card className="p-5"><p className="text-sm text-navy-400">Umsatz</p><p className="text-2xl font-bold text-gold-600">{totalRevenue.toFixed(2)} €</p></Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-3">Neuen Affiliate-Link anlegen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name *" className="px-3 py-2 rounded-xl border border-navy-200 text-sm" />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL *" className="px-3 py-2 rounded-xl border border-navy-200 text-sm" />
            <input value={form.product_image} onChange={e => setForm(f => ({ ...f, product_image: e.target.value }))} placeholder="Produktbild-URL" className="px-3 py-2 rounded-xl border border-navy-200 text-sm" />
            <input value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))} placeholder="Partner" className="px-3 py-2 rounded-xl border border-navy-200 text-sm" />
            <input value={form.product_description} onChange={e => setForm(f => ({ ...f, product_description: e.target.value }))} placeholder="Produktbeschreibung" className="px-3 py-2 rounded-xl border border-navy-200 text-sm col-span-full" />
          </div>
          <Button variant="primary" size="sm" onClick={createLink} loading={saving} disabled={!form.name.trim() || !form.url.trim()}>Erstellen</Button>
        </Card>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Noch keine Affiliate-Links.</p></Card>
      ) : (
        <div className="space-y-3">
          {links.map(l => (
            <Card key={l.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-navy-800">{l.name}</p>
                  <p className="text-sm text-navy-400 truncate max-w-sm">{l.url}</p>
                  <p className="text-xs text-navy-300 mt-1">
                    {l.partner && `Partner: ${l.partner} · `}
                    {l.click_count} Klicks · {l.conversion_count} Conversions ·
                    Tracking: <code className="text-xs bg-navy-100 px-1 rounded">/api/tracking?lid={l.id}</code>
                  </p>
                </div>
                <button onClick={() => deleteLink(l.id)} className="text-sm text-red-500 hover:text-red-700 cursor-pointer">Löschen</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Conversions */}
      {conversions.length > 0 && (
        <>
          <h3 className="font-semibold text-navy-800">Letzte Conversions</h3>
          <div className="space-y-2">
            {conversions.slice(0, 20).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl text-sm">
                <div>
                  <span className="text-navy-800">{c.email || 'Unbekannt'}</span>
                  <span className="text-navy-400 ml-2">{new Date(c.created_at).toLocaleString('de-DE')}</span>
                </div>
                <span className="font-bold text-emerald-600">{c.amount ? `${c.amount.toFixed(2)} €` : '–'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
