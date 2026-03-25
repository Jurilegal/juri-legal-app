import Link from 'next/link'

export default function RegisterChoicePage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-900">Konto erstellen</h1>
        <p className="text-navy-400 mt-2">Wählen Sie Ihren Kontotyp</p>
      </div>

      <div className="space-y-4">
        <Link href="/register/mandant" className="block group">
          <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-6 hover:border-gold-300 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-gold-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-800 group-hover:text-navy-900">Als Mandant</h2>
                <p className="text-sm text-navy-400 mt-1">Suchen Sie rechtliche Beratung? Registrieren Sie sich und verbinden Sie sich sofort mit einem Anwalt.</p>
              </div>
              <svg className="w-5 h-5 text-navy-300 group-hover:text-gold-400 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/register/anwalt" className="block group">
          <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-6 hover:border-gold-300 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-gold-400/25">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-800 group-hover:text-navy-900">Als Anwalt</h2>
                <p className="text-sm text-navy-400 mt-1">Erweitern Sie Ihre Mandantschaft. Bieten Sie Beratungen an und verdienen Sie flexibel.</p>
              </div>
              <svg className="w-5 h-5 text-navy-300 group-hover:text-gold-400 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="text-center text-sm text-navy-400">
        Bereits ein Konto?{' '}
        <Link href="/login" className="text-gold-500 hover:text-gold-600 font-semibold">
          Anmelden
        </Link>
      </div>
    </div>
  )
}
