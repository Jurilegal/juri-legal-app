import { Card } from '@/components/ui/Card'

const stats = [
  { label: 'Beratungen', value: '0', icon: '📞' },
  { label: 'Bewertung', value: '–', icon: '⭐' },
  { label: 'Einnahmen', value: '0,00 €', icon: '💰' },
  { label: 'Verfügbar', value: 'Nein', icon: '🟢' },
]

export default function AnwaltDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-400">{s.label}</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-navy-800 mb-4">Erste Schritte</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gold-50 rounded-xl border border-gold-200">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
            <p className="text-sm text-navy-700"><strong>Profil vervollständigen</strong> — Fügen Sie Fachgebiete, Bio und Minutenpreis hinzu</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-100">
            <div className="w-8 h-8 bg-navy-300 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
            <p className="text-sm text-navy-500">Dokumente hochladen (Zulassung & Ausweis)</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-100">
            <div className="w-8 h-8 bg-navy-300 rounded-lg flex items-center justify-center text-white text-sm font-bold">3</div>
            <p className="text-sm text-navy-500">Auf Verifizierung warten & Verfügbarkeit aktivieren</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
