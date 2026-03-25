'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface TimeSlot { day: number; from: string; to: string }
interface Absence { from: string; to: string; reason: string }

const dayLabels = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export default function VerfuegbarkeitPage() {
  const supabase = createClient()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [channels, setChannels] = useState<string[]>(['chat', 'video'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSlot, setNewSlot] = useState({ day: 1, from: '09:00', to: '17:00' })
  const [newAbsence, setNewAbsence] = useState({ from: '', to: '', reason: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('lawyer_profiles').select('availability_slots, calendar_absences, communication_channels').eq('user_id', user.id).single()
      if (data) {
        setSlots((data.availability_slots as TimeSlot[]) || [])
        setAbsences((data.calendar_absences as Absence[]) || [])
        setChannels((data.communication_channels as string[]) || ['chat', 'video'])
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveAll() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('lawyer_profiles').update({
      availability_slots: slots,
      calendar_absences: absences,
      communication_channels: channels,
    }).eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addSlot() {
    setSlots([...slots, { ...newSlot }])
  }

  function removeSlot(i: number) { setSlots(slots.filter((_, idx) => idx !== i)) }

  function addAbsence() {
    if (!newAbsence.from || !newAbsence.to) return
    setAbsences([...absences, { ...newAbsence }])
    setNewAbsence({ from: '', to: '', reason: '' })
  }

  function removeAbsence(i: number) { setAbsences(absences.filter((_, idx) => idx !== i)) }

  function toggleChannel(ch: string) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-navy-800">Verfügbarkeit</h2>

      {/* Communication Channels */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Kommunikationskanäle</h3>
        <p className="text-sm text-navy-400 mb-3">Welche Kontaktarten möchten Sie anbieten?</p>
        <div className="flex gap-3">
          {[{ key: 'video', label: '📹 Videoanruf' }, { key: 'chat', label: '💬 Chat' }].map(ch => (
            <button key={ch.key} onClick={() => toggleChannel(ch.key)} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${channels.includes(ch.key) ? 'bg-gold-400 text-white' : 'bg-navy-100 text-navy-500'}`}>
              {ch.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Recurring Slots */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Wiederkehrende Zeiten</h3>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="text-xs text-navy-400 block mb-1">Tag</label>
            <select value={newSlot.day} onChange={e => setNewSlot(p => ({ ...p, day: parseInt(e.target.value) }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm">
              {dayLabels.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-navy-400 block mb-1">Von</label>
            <input type="time" value={newSlot.from} onChange={e => setNewSlot(p => ({ ...p, from: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <div>
            <label className="text-xs text-navy-400 block mb-1">Bis</label>
            <input type="time" value={newSlot.to} onChange={e => setNewSlot(p => ({ ...p, to: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <Button variant="outline" size="sm" onClick={addSlot}>+ Hinzufügen</Button>
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-navy-400">Keine wiederkehrenden Zeiten eingerichtet.</p>
        ) : (
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <span className="text-sm text-navy-800">{dayLabels[s.day]} · {s.from} – {s.to}</span>
                <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-600 cursor-pointer text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Absences */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-3">Abwesenheiten / Urlaub</h3>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="text-xs text-navy-400 block mb-1">Von</label>
            <input type="date" value={newAbsence.from} onChange={e => setNewAbsence(p => ({ ...p, from: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <div>
            <label className="text-xs text-navy-400 block mb-1">Bis</label>
            <input type="date" value={newAbsence.to} onChange={e => setNewAbsence(p => ({ ...p, to: e.target.value }))} className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <div>
            <label className="text-xs text-navy-400 block mb-1">Grund</label>
            <input value={newAbsence.reason} onChange={e => setNewAbsence(p => ({ ...p, reason: e.target.value }))} placeholder="Optional" className="px-3 py-2 rounded-lg border border-navy-200 text-sm" />
          </div>
          <Button variant="outline" size="sm" onClick={addAbsence}>+ Hinzufügen</Button>
        </div>
        {absences.length === 0 ? (
          <p className="text-sm text-navy-400">Keine Abwesenheiten eingetragen.</p>
        ) : (
          <div className="space-y-2">
            {absences.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <span className="text-sm text-navy-800">{new Date(a.from).toLocaleDateString('de-DE')} – {new Date(a.to).toLocaleDateString('de-DE')}{a.reason ? ` (${a.reason})` : ''}</span>
                <button onClick={() => removeAbsence(i)} className="text-red-400 hover:text-red-600 cursor-pointer text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Google Calendar */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-2">Google Kalender</h3>
        <p className="text-sm text-navy-400 mb-3">Verknüpfen Sie Ihren Google Kalender, um gebuchte Termine automatisch als &quot;nicht verfügbar&quot; anzuzeigen.</p>
        <Button variant="outline" size="sm" disabled>🔗 Mit Google Kalender verknüpfen (bald verfügbar)</Button>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={saveAll} loading={saving}>Alle Änderungen speichern</Button>
        {saved && <span className="text-sm text-emerald-600">✓ Gespeichert</span>}
      </div>
    </div>
  )
}
