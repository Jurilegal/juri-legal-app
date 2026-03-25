'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function MandantRegisterPage() {
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
    if (form.password.length < 8) e.password = 'Mindestens 8 Zeichen'
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
          role: 'mandant',
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
        <h1 className="text-2xl font-bold text-navy-900">Mandanten-Konto erstellen</h1>
        <p className="text-navy-400 mt-2">Registrieren Sie sich für sofortige Rechtsberatung</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vorname" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} error={errors.firstName} required />
          <Input label="Nachname" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} error={errors.lastName} required />
        </div>
        <Input label="E-Mail-Adresse" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} placeholder="ihre@email.de" required />
        <Input label="Passwort" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} error={errors.password} placeholder="Min. 8 Zeichen" required />
        <Input label="Passwort bestätigen" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} error={errors.confirmPassword} required />

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

        <Button type="submit" loading={loading} className="w-full">Konto erstellen</Button>
      </form>

      <div className="mt-6 text-center text-sm text-navy-400">
        Bereits ein Konto? <Link href="/login" className="text-gold-500 hover:text-gold-600 font-semibold">Anmelden</Link>
      </div>
    </div>
  )
}
