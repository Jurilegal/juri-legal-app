import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-navy-800/5 border border-navy-100 p-8 text-center">
      <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-navy-900 mb-3">Überprüfen Sie Ihr E-Mail-Postfach</h1>
      <p className="text-navy-400 mb-6 leading-relaxed">
        Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
      </p>
      <div className="bg-navy-50 rounded-xl p-4 text-sm text-navy-500 mb-6">
        <p><strong>Tipp:</strong> Überprüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten haben.</p>
      </div>
      <Link href="/login" className="text-gold-500 hover:text-gold-600 font-semibold text-sm">
        Zurück zur Anmeldung
      </Link>
    </div>
  )
}
