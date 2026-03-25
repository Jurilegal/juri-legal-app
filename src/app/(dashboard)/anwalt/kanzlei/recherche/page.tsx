'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface SearchResult { id: string; title: string; court: string; date: string; type: string; summary: string; reference: string }

// Mock results for demo (in production: juris API)
const mockResults: SearchResult[] = [
  { id: '1', title: 'Kündigung während Elternzeit — Sonderkündigungsschutz', court: 'BAG', date: '2025-09-15', type: 'Urteil', summary: 'Das Bundesarbeitsgericht bestätigt den Sonderkündigungsschutz gem. § 18 BEEG...', reference: '2 AZR 123/25' },
  { id: '2', title: 'Mietminderung bei Schimmelbefall — Beweislast', court: 'BGH', date: '2025-11-20', type: 'Urteil', summary: 'Der BGH stellt klar, dass der Vermieter die Beweislast für das Lüftungsverhalten des Mieters trägt...', reference: 'VIII ZR 456/25' },
  { id: '3', title: 'DSGVO-Auskunftsanspruch — Frist und Umfang', court: 'EuGH', date: '2026-01-10', type: 'Urteil', summary: 'Der EuGH konkretisiert den Umfang des Auskunftsanspruchs nach Art. 15 DSGVO...', reference: 'C-789/25' },
  { id: '4', title: 'Geschwindigkeitsüberschreitung — Verwertungsverbot bei fehlerhafter Messung', court: 'OLG Frankfurt', date: '2025-08-05', type: 'Beschluss', summary: 'Das OLG Frankfurt hebt einen Bußgeldbescheid auf wegen nicht ordnungsgemäßer Kalibrierung...', reference: '1 Ss-OWi 234/25' },
]

export default function RecherchePage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ rechtsgebiet: '', docType: '', year: '' })
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)

  async function search() {
    if (!query.trim()) return
    setSearching(true); setSearched(true); setSelected(null)
    // Log query
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('legal_research_queries').insert({ user_id: user.id, query, filters, result_count: mockResults.length })
    }
    // In production: call juris API via /api/anwalt/legal-research
    await new Promise(r => setTimeout(r, 800)) // Simulate API delay
    const filtered = mockResults.filter(r => {
      const q = query.toLowerCase()
      return r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q)
    })
    setResults(filtered.length > 0 ? filtered : mockResults) // Fallback to all for demo
    setSearching(false)
  }

  if (selected) return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => setSelected(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Zurück zur Suche</button>
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="neutral">{selected.type}</Badge>
          <Badge variant="neutral">{selected.court}</Badge>
          <span className="text-sm text-navy-400">{selected.reference}</span>
        </div>
        <h2 className="text-xl font-bold text-navy-800 mb-4">{selected.title}</h2>
        <p className="text-sm text-navy-400 mb-6">{new Date(selected.date).toLocaleDateString('de-DE')}</p>
        <div className="text-navy-600 leading-relaxed">
          <p>{selected.summary}</p>
          <p className="mt-4 text-navy-400 italic">Volltext wird über die juris-API bereitgestellt. Für die Demo wird eine Zusammenfassung angezeigt.</p>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Juristische Datenbank</h2>
      <Card className="p-6">
        <div className="flex gap-3 mb-4">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Rechtsbegriff, Aktenzeichen oder Schlagwort eingeben..."
            className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-sm focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 outline-none" />
          <Button variant="primary" onClick={search} loading={searching}>🔍 Suchen</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filters.rechtsgebiet} onChange={e => setFilters(f => ({ ...f, rechtsgebiet: e.target.value }))} className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm">
            <option value="">Alle Rechtsgebiete</option>
            <option>Arbeitsrecht</option><option>Mietrecht</option><option>Strafrecht</option><option>Datenschutz</option><option>Verkehrsrecht</option>
          </select>
          <select value={filters.docType} onChange={e => setFilters(f => ({ ...f, docType: e.target.value }))} className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm">
            <option value="">Alle Dokumenttypen</option>
            <option>Urteil</option><option>Beschluss</option><option>Gesetz</option><option>Kommentar</option>
          </select>
          <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm">
            <option value="">Alle Jahre</option>
            <option>2026</option><option>2025</option><option>2024</option><option>2023</option>
          </select>
        </div>
      </Card>

      {!searched ? (
        <Card className="p-12 text-center">
          <span className="text-5xl block mb-4">⚖️</span>
          <p className="text-navy-400">Durchsuchen Sie Urteile, Beschlüsse, Gesetze und Kommentare.</p>
          <p className="text-sm text-navy-300 mt-2">Powered by juris — nahtlos integriert in JuriLegal.</p>
        </Card>
      ) : results.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-navy-400">Keine Ergebnisse gefunden.</p></Card>
      ) : (
        <div className="space-y-3">{results.map(r => (
          <Card key={r.id} className="p-5 cursor-pointer hover:border-gold-300 transition-all" onClick={() => setSelected(r)}>
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="neutral">{r.type}</Badge>
              <Badge variant="neutral">{r.court}</Badge>
              <span className="text-xs text-navy-400">{r.reference} · {new Date(r.date).toLocaleDateString('de-DE')}</span>
            </div>
            <h3 className="font-medium text-navy-800">{r.title}</h3>
            <p className="text-sm text-navy-500 mt-1 line-clamp-2">{r.summary}</p>
          </Card>
        ))}</div>
      )}
    </div>
  )
}
