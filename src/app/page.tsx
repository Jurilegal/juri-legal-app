import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const specializations = [
  'Arbeitsrecht', 'Familienrecht', 'Mietrecht', 'Verkehrsrecht',
  'Strafrecht', 'Erbrecht', 'Vertragsrecht', 'Sozialrecht',
]

const steps = [
  {
    num: '01',
    title: 'Anwalt finden',
    desc: 'Durchsuchen Sie unser Netzwerk verifizierter Anwälte nach Fachgebiet, Bewertung und Verfügbarkeit.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    ),
  },
  {
    num: '02',
    title: 'Beratung starten',
    desc: 'Starten Sie sofort eine Video- oder Chat-Beratung mit Ihrem gewählten Anwalt. Keine Wartezeit.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
    ),
  },
  {
    num: '03',
    title: 'Per Minute bezahlen',
    desc: 'Zahlen Sie nur für die Zeit, die Sie tatsächlich nutzen. Transparent, fair und ohne versteckte Kosten.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  },
]

const benefits = [
  {
    title: 'Verifizierte Anwälte',
    desc: 'Jeder Anwalt wird manuell geprüft und verifiziert. Zulassungsnachweise werden kontrolliert.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    title: 'Transparente Preise',
    desc: 'Ab 2,99 € pro Minute. Keine Abonnements, keine versteckten Gebühren. Sie zahlen nur, was Sie nutzen.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    title: 'Sofort verfügbar',
    desc: 'Keine Terminvereinbarung nötig. Finden Sie einen verfügbaren Anwalt und starten Sie sofort.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    title: 'DSGVO-konform',
    desc: 'Ihre Daten werden nach höchsten deutschen Datenschutzstandards geschützt. Ende-zu-Ende-Verschlüsselung.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
  {
    title: 'Alle Rechtsgebiete',
    desc: 'Von Arbeitsrecht bis Verkehrsrecht — finden Sie Experten für jedes Rechtsgebiet.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  },
  {
    title: '24/7 Erreichbar',
    desc: 'Unsere Plattform ist rund um die Uhr verfügbar. Rechtsberatung, wann immer Sie sie brauchen.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
]

const faqs = [
  { q: 'Wie funktioniert die Abrechnung?', a: 'Sie zahlen nur für die tatsächlich genutzte Beratungszeit, minutengenau abgerechnet. Der Minutenpreis wird vor Beratungsbeginn angezeigt. Es gibt keine versteckten Kosten oder Mindestlaufzeiten.' },
  { q: 'Sind die Anwälte wirklich verifiziert?', a: 'Ja. Jeder Anwalt muss seine Zulassung und einen Identitätsnachweis hochladen. Unser Team prüft jeden Antrag manuell, bevor ein Anwalt auf der Plattform freigeschaltet wird.' },
  { q: 'Ist die Beratung vertraulich?', a: 'Absolut. Alle Gespräche sind durch Ende-zu-Ende-Verschlüsselung geschützt. Die anwaltliche Schweigepflicht gilt selbstverständlich auch bei Online-Beratungen.' },
  { q: 'Welche Rechtsgebiete werden abgedeckt?', a: 'Unsere Anwälte decken alle gängigen Rechtsgebiete ab: Arbeitsrecht, Familienrecht, Mietrecht, Verkehrsrecht, Strafrecht, Erbrecht, Vertragsrecht und viele mehr.' },
  { q: 'Kann ich den Anwalt bewerten?', a: 'Ja, nach jeder Beratung können Sie eine Bewertung abgeben. Dies hilft anderen Nutzern bei der Auswahl und gewährleistet die Qualität unserer Plattform.' },
  { q: 'Was kostet die Registrierung?', a: 'Die Registrierung ist für Mandanten und Anwälte kostenlos. Kosten fallen erst bei einer tatsächlichen Beratung an.' },
]

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-gold-50" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-navy-700">Anwälte jetzt verfügbar</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              <span className="text-navy-900">Sofortige</span><br />
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">Rechtsberatung.</span><br />
              <span className="text-navy-900">Per Minute.</span>
            </h1>

            <p className="mt-6 text-xl text-navy-500 max-w-2xl leading-relaxed">
              Verbinden Sie sich in Sekunden mit verifizierten Anwälten. Transparent abgerechnet, ohne Wartezeit, ohne versteckte Kosten.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-navy-700 to-navy-800 text-white hover:from-navy-800 hover:to-navy-900 shadow-xl shadow-navy-800/25 transition-all duration-200">
                Jetzt Beratung starten
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/register/anwalt" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl border-2 border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition-all duration-200">
                Als Anwalt registrieren
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm text-navy-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Kostenlose Registrierung
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Ab 2,99 €/min
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                DSGVO-konform
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specializations Bar */}
      <section className="bg-navy-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {specializations.map(s => (
              <span key={s} className="px-4 py-2 bg-navy-700/50 backdrop-blur rounded-lg text-sm text-navy-200 border border-navy-600/30">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="so-funktionierts" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-wider">So einfach geht&apos;s</span>
            <h2 className="mt-3 text-4xl font-bold text-navy-900">In drei Schritten zur Rechtsberatung</h2>
            <p className="mt-4 text-lg text-navy-400 max-w-2xl mx-auto">Keine komplizierten Prozesse. Keine langen Wartezeiten. Einfach, schnell und transparent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(step => (
              <div key={step.num} className="relative group">
                <div className="bg-gradient-to-br from-navy-50 to-white p-8 rounded-2xl border border-navy-100 hover:border-gold-300 hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-gold-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-gold-400/25">
                    {step.icon}
                  </div>
                  <span className="text-5xl font-black text-navy-100 absolute top-4 right-6">{step.num}</span>
                  <h3 className="text-xl font-bold text-navy-800 mb-3">{step.title}</h3>
                  <p className="text-navy-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gradient-to-br from-navy-50 to-gold-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-wider">Warum Juri Legal</span>
            <h2 className="mt-3 text-4xl font-bold text-navy-900">Die Plattform, der Mandanten vertrauen</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(b => (
              <div key={b.title} className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-navy-100 hover:border-gold-300 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-gold-400 mb-4">
                  {b.icon}
                </div>
                <h3 className="text-lg font-bold text-navy-800 mb-2">{b.title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-wider">Preise</span>
            <h2 className="mt-3 text-4xl font-bold text-navy-900">Transparent. Fair. Minutengenau.</h2>
            <p className="mt-4 text-lg text-navy-400">Keine Abonnements. Keine Mindestlaufzeiten. Sie zahlen nur, was Sie nutzen.</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl p-8 text-white shadow-2xl shadow-navy-800/40 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold-400/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-gold-400/20 rounded-full px-3 py-1 mb-6">
                  <span className="text-gold-400 text-sm font-medium">Pay-per-Minute</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-extrabold">ab 2,99 €</span>
                  <span className="text-navy-300 text-lg">/min</span>
                </div>
                <p className="text-navy-300 mb-8">Minutenpreis variiert je nach Anwalt und Fachgebiet</p>

                <ul className="space-y-3 mb-8">
                  {['Kostenlose Registrierung', 'Keine Mindestdauer', 'Sekundengenaue Abrechnung', 'Sofortige Verfügbarkeit', 'Alle Rechtsgebiete', 'Video, Audio & Chat'].map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gold-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      <span className="text-navy-100">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block w-full text-center px-6 py-4 bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 font-bold rounded-xl hover:from-gold-500 hover:to-gold-600 transition-all duration-200 shadow-lg shadow-gold-400/25">
                  Jetzt kostenlos registrieren
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Lawyers */}
      <section className="py-24 bg-gradient-to-r from-navy-800 to-navy-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Sie sind Anwalt?</h2>
          <p className="text-xl text-navy-300 mb-8 max-w-2xl mx-auto">
            Erweitern Sie Ihre Reichweite und gewinnen Sie neue Mandanten. Flexible Zeiteinteilung, faire Konditionen, kein Risiko.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/anwalt" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 hover:from-gold-500 hover:to-gold-600 shadow-xl shadow-gold-400/25 transition-all duration-200">
              Als Anwalt registrieren
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/#so-funktionierts" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl border-2 border-navy-600 text-white hover:bg-navy-700 transition-all duration-200">
              Mehr erfahren
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="mt-3 text-4xl font-bold text-navy-900">Häufig gestellte Fragen</h2>
          </div>

          <div className="space-y-4">
            {faqs.map(faq => (
              <details key={faq.q} className="group bg-navy-50/50 rounded-2xl border border-navy-100 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-navy-800 hover:text-navy-900">
                  {faq.q}
                  <svg className="w-5 h-5 text-navy-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-6 text-navy-500 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-navy-50 to-gold-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-navy-900 mb-4">Bereit für Ihre Rechtsberatung?</h2>
          <p className="text-xl text-navy-500 mb-8">Registrieren Sie sich kostenlos und verbinden Sie sich in Sekunden mit einem Anwalt.</p>
          <Link href="/register" className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold rounded-2xl bg-gradient-to-r from-navy-700 to-navy-800 text-white hover:from-navy-800 hover:to-navy-900 shadow-xl shadow-navy-800/25 transition-all duration-200">
            Kostenlos registrieren
            <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
