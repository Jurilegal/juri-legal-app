'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AnwaltRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', agb: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate() {
    const e: Record<string, string> = {}
    if (form.firstName.length < 2) e.firstName = 'Mindestens 2 Zeichen'
    if (form.lastName.length < 2) e.lastName = 'Mindestens 2 Zeichen'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Ungültige E-Mail-Adresse'
    if (form.password.length < 12) e.password = 'Mindestens 12 Zeichen'
    if (!/[A-Z]/.test(form.password)) e.password = 'Min. 1 Großbuchstabe'
    if (!/[a-z]/.test(form.password)) e.password = 'Min. 1 Kleinbuchstabe'
    if (!/[0-9]/.test(form.password)) e.password = 'Min. 1 Zahl'
    if (!/[^A-Za-z0-9]/.test(form.password)) e.password = 'Min. 1 Sonderzeichen'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwörter stimmen nicht überein'
    if (!form.agb) e.agb = 'Sie müssen die AGB akzeptieren'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          role: 'anwalt',
        },
      },
    })

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    router.push('/verify-email')
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-navy-800/5 border border-navy-100 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-full px-3 py-1 mb-4">
          <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
          <span className="text-sm font-medium text-gold-600">Anwalts-Registrierung</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Anwalts-Konto erstellen</h1>
        <p className="text-navy-400 mt-2">Treten Sie unserem Netzwerk verifizierter Anwälte bei</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vorname" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} error={errors.firstName} required />
          <Input label="Nachname" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} error={errors.lastName} required />
        </div>
        <Input label="E-Mail-Adresse" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} placeholder="anwalt@kanzlei.de" required />
        <Input label="Passwort" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} error={errors.password} placeholder="Min. 12 Zeichen, Groß/Klein/Zahl/Sonderzeichen" required />
        <Input label="Passwort bestätigen" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} error={errors.confirmPassword} required />

        <div className="bg-navy-50 rounded-xl p-4 text-sm text-navy-500 space-y-1">
          <p className="font-medium text-navy-700">Passwort-Anforderungen:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li className={form.password.length >= 12 ? 'text-emerald-600' : ''}>Mindestens 12 Zeichen</li>
            <li className={/[A-Z]/.test(form.password) ? 'text-emerald-600' : ''}>Ein Großbuchstabe</li>
            <li className={/[a-z]/.test(form.password) ? 'text-emerald-600' : ''}>Ein Kleinbuchstabe</li>
            <li className={/[0-9]/.test(form.password) ? 'text-emerald-600' : ''}>Eine Zahl</li>
            <li className={/[^A-Za-z0-9]/.test(form.password) ? 'text-emerald-600' : ''}>Ein Sonderzeichen</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.agb} onChange={e => setForm(f => ({ ...f, agb: e.target.checked }))} className="mt-1 w-4 h-4 rounded border-navy-300 text-gold-500 focus:ring-gold-400" />
          <span className="text-sm text-navy-500">
            Ich akzeptiere die <Link href="/agb" className="text-gold-500 hover:underline">AGB</Link> und die <Link href="/datenschutz" className="text-gold-500 hover:underline">Datenschutzerklärung</Link>
          </span>
        </label>
        {errors.agb && <p className="text-sm text-red-500">{errors.agb}</p>}

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{serverError}</div>
        )}

        <Button type="submit" loading={loading} variant="secondary" className="w-full">Anwalts-Konto erstellen</Button>
      </form>

      <p className="mt-4 text-xs text-navy-400 text-center">
        Nach der Registrierung müssen Sie Ihre Zulassung nachweisen. Ihr Profil wird nach Prüfung freigeschaltet.
      </p>

      <div className="mt-6 text-center text-sm text-navy-400">
        Bereits ein Konto? <Link href="/login" className="text-gold-500 hover:text-gold-600 font-semibold">Anmelden</Link>
      </div>
    </div>
  )
}
