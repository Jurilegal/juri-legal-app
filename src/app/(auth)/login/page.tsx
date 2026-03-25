'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Ungültige E-Mail oder Passwort.'
        : error.message)
      setLoading(false)
      return
    }

    // Get user role to redirect properly
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()

    if (profile?.role === 'anwalt') {
      router.push('/anwalt/dashboard')
    } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/mandant/dashboard')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-navy-800/5 border border-navy-100 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Willkommen zurück</h1>
        <p className="text-navy-400 mt-2">Melden Sie sich bei Ihrem Konto an</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <Input
          label="E-Mail-Adresse"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ihre@email.de"
          required
        />
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Anmelden
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-navy-400">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-gold-500 hover:text-gold-600 font-semibold">
          Jetzt registrieren
        </Link>
      </div>
    </div>
  )
}
