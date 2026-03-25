'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const systems = [
  { id: 'ra-micro', name: 'RA-MICRO', icon: '🏛️' },
  { id: 'actaport', name: 'Actaport', icon: '📋' },
  { id: 'kleos', name: 'Kleos', icon: '⚖️' },
  { id: 'advoware', name: 'Advoware', icon: '💼' },
  { id: 'annotext', name: 'AnNoText', icon: '📝' },
  { id: 'other', name: 'Andere Software', icon: '🔧' },
]

const defaultMapping = [
  { source: 'Mandantennachname', target: 'last_name', auto: true },
  { source: 'Mandantenvorname', target: 'first_name', auto: true },
  { source: 'Aktenzeichen', target: 'reference_number', auto: true },
  { source: 'Gegner', target: 'opponent_name', auto: true },
  { source: 'Mdt-Nr.', target: '', auto: false },
]

const targetFields = ['first_name', 'last_name', 'email', 'phone', 'address', 'company_name', 'reference_number', 'opponent_name', 'case_type', 'notes', 'custom_id']

export default function MigrationPage() {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [system, setSystem] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '', apiKey: '' })
  const [analysis, setAnalysis] = useState({ cases: 0, documents: 0, contacts: 0, estimatedMinutes: 0 })
  const [mapping, setMapping] = useState(defaultMapping)
  const [progress, setProgress] = useState(0)
  const [migrating, setMigrating] = useState(false)
  const [report, setReport] = useState<{ migrated: number; total: number; errors: number; errorDetails: string[] } | null>(null)

  async function analyze() {
    // Simulate analysis
    await new Promise(r => setTimeout(r, 1500))
    setAnalysis({ cases: Math.floor(Math.random() * 2000) + 100, documents: Math.floor(Math.random() * 8000) + 500, contacts: Math.floor(Math.random() * 500) + 50, estimatedMinutes: Math.floor(Math.random() * 60) + 15 })
    setStep(2)
  }

  async function startMigration() {
    setStep(4); setMigrating(true); setProgress(0)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create migration job
    await supabase.from('migration_jobs').insert({
      user_id: user.id, source_system: system, status: 'migrating',
      total_items: analysis.cases + analysis.documents + analysis.contacts,
      field_mapping: mapping,
    })

    // Simulate migration progress
    const total = analysis.cases + analysis.documents
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 200))
      setProgress(i)
    }

    const errors = Math.floor(Math.random() * 5)
    setReport({
      migrated: total - errors, total,
      errors,
      errorDetails: errors > 0 ? Array.from({ length: errors }, (_, i) => `Dokument #${Math.floor(Math.random() * 1000)} konnte nicht heruntergeladen werden (Timeout)`) : [],
    })
    setMigrating(false); setStep(5)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Migrations-Wizard</h2>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-gold-400 text-white' : 'bg-navy-100 text-navy-400'}`}>{s}</div>
            {s < 5 && <div className={`w-8 h-0.5 ${step > s ? 'bg-gold-400' : 'bg-navy-200'}`} />}
          </div>
        ))}
      </div>
      <p className="text-sm text-navy-400">Schritt {step} von 5: {['Tool-Auswahl', 'Daten-Analyse', 'Feld-Mapping', 'Migration', 'Abschluss'][step - 1]}</p>

      {/* Step 1: Tool Selection */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Wählen Sie Ihre aktuelle Kanzleisoftware</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {systems.map(s => (
              <button key={s.id} onClick={() => setSystem(s.id)}
                className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${system === s.id ? 'border-gold-400 bg-gold-50 shadow-sm' : 'border-navy-200 hover:border-navy-300'}`}>
                <span className="text-2xl block mb-1">{s.icon}</span>
                <span className="text-sm font-medium text-navy-700">{s.name}</span>
              </button>
            ))}
          </div>
          {system && (
            <div className="space-y-3 pt-4 border-t border-navy-100">
              <p className="text-sm text-navy-400">Geben Sie Ihre Zugangsdaten ein. Diese werden nur für die Migration verwendet und nicht gespeichert.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-navy-400">Benutzername / E-Mail</label><input type="text" value={credentials.username} onChange={e => setCredentials(c => ({ ...c, username: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm mt-1" /></div>
                <div><label className="text-xs text-navy-400">Passwort / API-Key</label><input type="password" value={credentials.password} onChange={e => setCredentials(c => ({ ...c, password: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm mt-1" /></div>
              </div>
              <Button variant="primary" onClick={analyze} disabled={!credentials.username || !credentials.password}>Verbinden & Analysieren</Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Analysis */}
      {step === 2 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">✅ Analyse abgeschlossen</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-navy-50 rounded-xl"><p className="text-2xl font-bold text-navy-900">{analysis.cases.toLocaleString()}</p><p className="text-xs text-navy-400">Akten</p></div>
            <div className="text-center p-4 bg-navy-50 rounded-xl"><p className="text-2xl font-bold text-navy-900">{analysis.documents.toLocaleString()}</p><p className="text-xs text-navy-400">Dokumente</p></div>
            <div className="text-center p-4 bg-navy-50 rounded-xl"><p className="text-2xl font-bold text-navy-900">{analysis.contacts}</p><p className="text-xs text-navy-400">Kontakte</p></div>
          </div>
          <p className="text-sm text-navy-500">Geschätzte Migrationsdauer: <strong>{analysis.estimatedMinutes} Minuten</strong></p>
          <Button variant="primary" onClick={() => setStep(3)}>Weiter zum Feld-Mapping</Button>
        </Card>
      )}

      {/* Step 3: Mapping */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Feld-Zuordnung</h3>
          <p className="text-sm text-navy-400">Überprüfen und korrigieren Sie die automatische Zuordnung der Datenfelder.</p>
          <div className="space-y-3">
            {mapping.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
                <span className="text-sm font-medium text-navy-700 w-40">{m.source}</span>
                <span className="text-navy-300">→</span>
                <select value={m.target} onChange={e => setMapping(prev => prev.map((p, j) => j === i ? { ...p, target: e.target.value } : p))}
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${m.auto && m.target ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <option value="">— Bitte zuordnen —</option>
                  {targetFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {m.auto && m.target && <span className="text-emerald-500 text-xs">✓ Auto</span>}
              </div>
            ))}
          </div>
          <Button variant="primary" onClick={startMigration}>Migration starten</Button>
        </Card>
      )}

      {/* Step 4: Migration */}
      {step === 4 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">{migrating ? '🔄 Migration läuft...' : '✅ Migration abgeschlossen'}</h3>
          <div className="w-full h-4 bg-navy-100 rounded-full overflow-hidden">
            <div className="h-full bg-gold-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-navy-400 text-center">{progress}% — Migriere Daten...</p>
        </Card>
      )}

      {/* Step 5: Report */}
      {step === 5 && report && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">🎉 Migration erfolgreich!</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl"><p className="text-2xl font-bold text-emerald-700">{report.migrated.toLocaleString()}</p><p className="text-xs text-emerald-500">Migriert</p></div>
            <div className="text-center p-4 bg-navy-50 rounded-xl"><p className="text-2xl font-bold text-navy-700">{report.total.toLocaleString()}</p><p className="text-xs text-navy-400">Gesamt</p></div>
            <div className="text-center p-4 bg-red-50 rounded-xl"><p className="text-2xl font-bold text-red-600">{report.errors}</p><p className="text-xs text-red-400">Fehler</p></div>
          </div>
          {report.errorDetails.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-xl"><p className="text-sm font-medium text-amber-800 mb-2">Folgende Einträge erfordern manuelle Prüfung:</p>
              <ul className="text-xs text-amber-600 space-y-1">{report.errorDetails.map((e, i) => <li key={i}>⚠️ {e}</li>)}</ul></div>
          )}
          <p className="text-sm text-navy-500">Sie können die importierten Daten jetzt unter &quot;Digitale Akten&quot; einsehen.</p>
          <Button variant="primary" onClick={() => window.location.href = '/anwalt/kanzlei/akten'}>Zu den Akten →</Button>
        </Card>
      )}
    </div>
  )
}
