'use client'
import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  function decline() {
    localStorage.setItem('cookie-consent', 'essential-only')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-navy-200 shadow-lg p-4 sm:p-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-800 mb-1">🍪 Cookie-Hinweis</p>
          <p className="text-xs text-navy-500">
            Diese Website verwendet technisch notwendige Cookies für die Authentifizierung und Sitzungsverwaltung.
            Weitere Informationen finden Sie in unserer{' '}
            <a href="/datenschutz" className="text-gold-600 underline hover:text-gold-700">Datenschutzerklärung</a>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs border border-navy-200 rounded-xl text-navy-600 hover:bg-navy-50 cursor-pointer"
          >
            Nur notwendige
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs bg-navy-800 text-white rounded-xl hover:bg-navy-700 cursor-pointer"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}
