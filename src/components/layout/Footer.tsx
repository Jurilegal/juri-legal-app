import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Logo className="[&_span]:text-white [&_span:last-child]:text-gold-400" />
            <p className="text-navy-300 text-sm leading-relaxed">
              Sofortige Rechtsberatung per Minute. Verifizierte Anwälte. Transparente Preise. Keine versteckten Kosten.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gold-400 mb-4">Plattform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/anwaelte" className="text-navy-300 hover:text-white transition-colors">Anwälte finden</Link></li>
              <li><Link href="/#so-funktionierts" className="text-navy-300 hover:text-white transition-colors">So funktioniert&apos;s</Link></li>
              <li><Link href="/#preise" className="text-navy-300 hover:text-white transition-colors">Preise</Link></li>
              <li><Link href="/register/anwalt" className="text-navy-300 hover:text-white transition-colors">Als Anwalt registrieren</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold-400 mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/impressum" className="text-navy-300 hover:text-white transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="text-navy-300 hover:text-white transition-colors">Datenschutz</Link></li>
              <li><Link href="/agb" className="text-navy-300 hover:text-white transition-colors">AGB</Link></li>
              <li><Link href="/widerruf" className="text-navy-300 hover:text-white transition-colors">Widerrufsrecht</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold-400 mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-navy-300">info@juri-legal.com</li>
              <li className="text-navy-300">+49 (0) 30 1234567</li>
              <li className="text-navy-300">Berlin, Deutschland</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-navy-800 hover:bg-navy-700 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-navy-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-navy-800 hover:bg-navy-700 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-navy-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-navy-400 text-sm">© {new Date().getFullYear()} Juri Legal. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-navy-400 text-xs">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              SSL-verschlüsselt
            </div>
            <div className="flex items-center gap-2 text-navy-400 text-xs">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              DSGVO-konform
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
