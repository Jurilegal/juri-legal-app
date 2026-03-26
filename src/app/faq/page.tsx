'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Tab = 'allgemein' | 'privat' | 'b2b' | 'anwalt'

interface FAQ {
  q: string
  a: string
  screenshot?: string
}

const allgemeinFAQs: FAQ[] = [
  { q: 'Was ist JuriLegal?', a: 'JuriLegal ist eine professionelle On-Demand-Plattform für Rechtsberatung. Mandanten (privat oder geschäftlich) können verifizierte Anwälte finden und sofort per Chat oder Video beraten lassen — abgerechnet wird fair pro Minute. Für Anwälte bieten wir zusätzlich eine vollständige digitale Kanzlei-Lösung.', screenshot: '/screenshots/landing.png' },
  { q: 'Ist die Registrierung kostenlos?', a: 'Ja, die Registrierung ist für alle Nutzergruppen kostenlos. Mandanten zahlen nur, wenn sie eine Beratung starten. Anwälte können die Plattform im Basic-Tarif kostenlos nutzen — das All-in-One Kanzlei-Paket kostet 149 €/Monat.' },
  { q: 'Wie funktioniert die Abrechnung?', a: 'Sie zahlen nur für die tatsächlich genutzte Beratungszeit, minutengenau abgerechnet. Der Minutenpreis wird vor Beratungsbeginn angezeigt. Es gibt keine versteckten Kosten, keine Mindestlaufzeiten und keine Abo-Pflicht für Mandanten.' },
  { q: 'Sind die Anwälte wirklich verifiziert?', a: 'Ja. Jeder Anwalt muss seine Anwaltszulassung und einen Identitätsnachweis hochladen. Unser Team prüft jeden Antrag manuell, bevor ein Anwalt freigeschaltet wird. Je nach Land (DE/FR/IT) gelten unterschiedliche Dokumentanforderungen.' },
  { q: 'Ist die Beratung vertraulich?', a: 'Absolut. Alle Gespräche sind verschlüsselt. Die anwaltliche Schweigepflicht gilt selbstverständlich auch bei Online-Beratungen. Unsere Server stehen in Frankfurt (EU) und unterliegen der DSGVO.' },
  { q: 'Welche Rechtsgebiete werden abgedeckt?', a: 'Unsere Anwälte decken alle gängigen Rechtsgebiete ab: Arbeitsrecht, Familienrecht, Mietrecht, Verkehrsrecht, Strafrecht, Erbrecht, Vertragsrecht, IT-Recht, Handelsrecht, Datenschutzrecht, Sozialrecht und viele mehr.' },
  { q: 'Welche Zahlungsmethoden werden akzeptiert?', a: 'Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express) und SEPA-Lastschrift. Die Zahlungsabwicklung erfolgt über Stripe — ein weltweit führender Zahlungsdienstleister mit höchsten Sicherheitsstandards (PCI DSS Level 1).' },
  { q: 'Wie ist der Datenschutz geregelt?', a: 'JuriLegal ist vollständig DSGVO-konform. Alle Daten werden in der EU (Frankfurt) gespeichert. Wir verwenden Supabase mit Row Level Security — jeder Nutzer sieht nur seine eigenen Daten. Details finden Sie in unserer Datenschutzerklärung.' },
  { q: 'Gibt es eine App?', a: 'JuriLegal ist als responsive Web-App optimiert und funktioniert perfekt auf allen Geräten — Smartphone, Tablet und Desktop. Eine native App ist für die Zukunft geplant.' },
  { q: 'Wie erreiche ich den Support?', a: 'Anwälte können Support-Tickets direkt im Dashboard erstellen. Mandanten erreichen uns per E-Mail. Alle Tickets werden in Echtzeit an unser Admin-Team weitergeleitet.' },
]

const privatFAQs: FAQ[] = [
  { q: 'Wie finde ich den richtigen Anwalt?', a: 'Nutzen Sie unsere Anwaltssuche mit Filtern nach Fachgebiet, Stadt, Sprache, Preis und Bewertung. Jedes Anwaltsprofil zeigt Qualifikationen, Erfahrungsjahre und Bewertungen anderer Mandanten. Verfügbare Anwälte sind grün markiert.', screenshot: '/screenshots/anwaelte-suche.png' },
  { q: 'Wie starte ich eine Beratung?', a: 'Wählen Sie einen Anwalt aus, klicken Sie auf "Beratung starten" und wählen Sie Chat oder Video. Vor Start sehen Sie den Minutenpreis. Die Beratung wird minutengenau abgerechnet — Sie können jederzeit beenden.' },
  { q: 'Was sind Juri Coins?', a: 'Juri Coins sind Ihr Guthaben auf der Plattform. 1 Coin = 1 Euro. Laden Sie Coins per Kreditkarte auf und nutzen Sie diese für Beratungen. Bonus: Bei Newsletter-Anmeldung erhalten Sie 20 Coins geschenkt!', screenshot: '/screenshots/mandant-coins.png' },
  { q: 'Kann ich eine Beratung bewerten?', a: 'Ja, nach jeder Beratung können Sie 1–5 Sterne vergeben. Bei weniger als 3 Sternen ist ein Kommentar Pflicht — so stellen wir Qualität sicher. Als Dankeschön erhalten Sie 2 Gratis-Minuten für jede abgegebene Bewertung.' },
  { q: 'Was ist, wenn ich mit der Beratung unzufrieden bin?', a: 'Sie können innerhalb von 3 Tagen nach einer Beratung einen Streitfall eröffnen. Geben Sie den strittigen Betrag und den Grund an. Unser Admin-Team prüft den Fall und der Anwalt kann den Streitfall akzeptieren oder ablehnen.', screenshot: '/screenshots/mandant-zahlungen.png' },
  { q: 'Kann ich Rechnungen anfordern?', a: 'Ja. Unter "Beratungen" können Sie für jede einzelne Beratung oder mehrere gleichzeitig (Sammelrechnung) eine Rechnung anfordern. Markieren Sie die gewünschten Beratungen per Checkbox und klicken Sie auf "Rechnung anfordern".' },
  { q: 'Kann ich zwischen Privat- und Geschäftskonto wechseln?', a: 'Ja. In Ihrem Profil können Sie zwischen "Privat" und "Geschäftlich" umschalten. Bei Geschäftskonten können Sie zusätzlich eine USt-IdNr. hinterlegen, die auf Rechnungen ausgewiesen wird.' },
  { q: 'Wie sicher sind meine Zahlungsdaten?', a: 'Ihre Zahlungsdaten werden niemals auf unseren Servern gespeichert. Die gesamte Zahlungsabwicklung erfolgt über Stripe, das den höchsten Sicherheitsstandard PCI DSS Level 1 erfüllt. Sie können Zahlungsmethoden jederzeit hinzufügen oder entfernen.' },
  { q: 'Was sehe ich in meinem Dashboard?', a: 'Ihr Dashboard zeigt: aktuelle und vergangene Beratungen, Ihr Juri-Coin-Guthaben, offene Bewertungen und den Newsletter-Status. Von hier aus erreichen Sie alle Funktionen mit einem Klick.', screenshot: '/screenshots/mandant-dashboard.png' },
]

const b2bFAQs: FAQ[] = [
  { q: 'Was ist der Unterschied zum Privatkonto?', a: 'Das Geschäftskonto bietet: USt-IdNr. auf allen Rechnungen, Sammelrechnungen für die Buchhaltung, und die Möglichkeit, Rechtsberatung als Betriebsausgabe abzusetzen. Die Plattform-Funktionen sind identisch.' },
  { q: 'Kann ich Sammelrechnungen erhalten?', a: 'Ja. Unter "Beratungen" können Sie mehrere Beratungen per Checkbox auswählen (oder "Alle auswählen") und eine Sammelrechnung anfordern. Alle Rechnungen enthalten Ihre Firmenbezeichnung und USt-IdNr.', screenshot: '/screenshots/mandant-beratungen.png' },
  { q: 'Können mehrere Mitarbeiter das Konto nutzen?', a: 'Aktuell ist ein Konto pro E-Mail-Adresse vorgesehen. Multi-User-Konten für Unternehmen mit Abteilungsbudgets und Mitarbeiterverwaltung sind in Planung.' },
  { q: 'Gibt es Mengenrabatte?', a: 'Aktuell gelten die Standardpreise der jeweiligen Anwälte. Für Unternehmen mit regelmäßigem Beratungsbedarf können individuelle Vereinbarungen getroffen werden — kontaktieren Sie uns.' },
  { q: 'Wie funktioniert die Kostenkontrolle?', a: 'Über das Juri-Coin-System haben Sie volle Kostenkontrolle: Laden Sie einen bestimmten Betrag auf und behalten Sie über die Transaktionshistorie den Überblick. Es wird nie mehr abgebucht als Ihr Guthaben.', screenshot: '/screenshots/mandant-coins.png' },
  { q: 'Ist ein Auftragsverarbeitungsvertrag (AVV) verfügbar?', a: 'Ja. Anwälte, die das All-in-One-Paket nutzen, unterschreiben einen AVV digital. Für Unternehmen als Mandanten stellen wir auf Anfrage ebenfalls einen AVV bereit — DSGVO-konform.' },
  { q: 'Kann ich Beratungsdaten exportieren?', a: 'Ja. Alle Beratungen können als CSV exportiert werden (monatsweise). Dies ermöglicht eine einfache Integration in Ihre Buchhaltungssoftware.' },
  { q: 'Wo stehen die Server?', a: 'Alle Daten werden in der EU gespeichert (Frankfurt, Deutschland). Unsere Infrastruktur nutzt Supabase (EU-Region) und Vercel (Edge-Netzwerk). Volle DSGVO-Konformität ist gewährleistet.' },
]

const anwaltFAQs: FAQ[] = [
  { q: 'Wie werde ich auf JuriLegal freigeschaltet?', a: 'Registrieren Sie sich als Anwalt, laden Sie Ihre Anwaltszulassung und einen Identitätsnachweis hoch. Unser Team prüft Ihre Dokumente manuell. Nach erfolgreicher Verifizierung werden Sie freigeschaltet und können Beratungen anbieten.' },
  { q: 'Was kostet mich die Plattform?', a: 'Die Grundnutzung (Basic) ist kostenlos — Sie erhalten Beratungsanfragen und werden pro Minute bezahlt. JuriLegal behält eine transparente Plattformgebühr von 5%. Das All-in-One Kanzlei-Paket mit allen digitalen Tools kostet 149 €/Monat.' },
  { q: 'Was ist das Early-Adopter-Programm?', a: 'Die ersten 500 Anwälte, die auf All-in-One upgraden, erhalten das komplette Kanzlei-Paket 12 Monate lang kostenlos. Danach gilt der reguläre Preis von 149 €/Monat.', screenshot: '/screenshots/anwalt-abo.png' },
  { q: 'Wie lege ich meine Preise fest?', a: 'Unter "Preise" können Sie separate Minutenpreise für Chat und Video festlegen. Eine Live-Vorschau zeigt Ihre geschätzten Einnahmen als Balkendiagramm. Preisänderungen erfordern eine doppelte Bestätigung (Button → Modal → Bestätigen).', screenshot: '/screenshots/anwalt-preise.png' },
  { q: 'Wie verwalte ich meine Verfügbarkeit?', a: 'Unter "Verfügbarkeit" legen Sie wiederkehrende Zeitslots pro Wochentag fest. Sie können Abwesenheiten/Urlaub eintragen und Kommunikationskanäle (Chat/Video) einzeln aktivieren. Ein Toggle schaltet Ihre Verfügbarkeit sofort ein/aus.', screenshot: '/screenshots/anwalt-verfuegbarkeit.png' },
  { q: 'Wie sehe ich meine Einnahmen?', a: 'Unter "Einnahmen" sehen Sie Brutto-Einnahmen, Netto (nach 5% Gebühr) und die Plattformgebühr auf Karten. Per Monats-Dropdown und CSV-Export haben Sie volle Übersicht für Ihren Steuerberater.', screenshot: '/screenshots/anwalt-einnahmen.png' },
  { q: 'Was beinhaltet das All-in-One Kanzlei-Paket?', a: 'Das Paket umfasst: Digitale Aktenführung, Mandantenverwaltung, Fristen- & Aufgabenmanagement, Zeiterfassung mit Live-Timer, Rechnungsstellung, juristische Recherche (juris), beA-Postfach-Integration, DATEV-Export und den Migrations-Wizard.', screenshot: '/screenshots/anwalt-kanzlei.png' },
  { q: 'Wie funktioniert die digitale Aktenführung?', a: 'Erstellen Sie Akten mit Titel, Aktenzeichen und Rechtsgebiet. Laden Sie Dokumente hoch, weisen Sie Gegner zu und verfolgen Sie den Status (Offen → In Bearbeitung → Abgeschlossen → Archiviert). Volltextsuche hilft beim schnellen Finden.', screenshot: '/screenshots/anwalt-akten.png' },
  { q: 'Wie funktioniert die Zeiterfassung?', a: 'Sie können einen Live-Timer starten oder Zeiten manuell erfassen. Jeder Eintrag enthält Tätigkeit, Dauer, Stundensatz und Datum. Offene Stunden und der daraus resultierende Umsatz werden automatisch berechnet. Einträge lassen sich direkt in Rechnungen überführen.', screenshot: '/screenshots/anwalt-zeiterfassung.png' },
  { q: 'Wie erstelle ich Rechnungen?', a: 'Unter "Rechnungen" wählen Sie offene Zeiteinträge per Checkbox aus, ordnen optional einen Kanzlei-Mandanten zu, und die Rechnung wird automatisch erstellt — inklusive 19% MwSt.-Berechnung und fortlaufender Rechnungsnummer.', screenshot: '/screenshots/anwalt-rechnungen.png' },
  { q: 'Was ist der DATEV-Export?', a: 'Der DATEV-Export generiert eine CSV-Datei im offiziellen DATEV Buchungsstapel-Format. Wählen Sie einen Zeitraum und laden Sie die Datei herunter — kompatibel mit DATEV Unternehmen online für Ihren Steuerberater.', screenshot: '/screenshots/anwalt-datev.png' },
  { q: 'Wie migriere ich von meiner aktuellen Software?', a: 'Der 5-Schritte-Migrations-Wizard unterstützt RA-MICRO, Actaport, Kleos, Advoware und AnNoText. Nach der Verbindung analysiert das System Ihre Daten, zeigt ein Feld-Mapping und migriert alles mit Live-Fortschrittsanzeige.', screenshot: '/screenshots/anwalt-migration.png' },
  { q: 'Wie funktioniert das beA-Postfach?', a: 'Das integrierte beA-Postfach zeigt Eingang, Ausgang und Entwürfe. Sie können Nachrichten an beA-SAFE-IDs senden und empfangen. Eine gültige beA-Karte ist erforderlich.', screenshot: '/screenshots/anwalt-bea.png' },
  { q: 'Kann ich unfaire Bewertungen melden?', a: 'Ja. Bei Bewertungen, die Sie als unfair empfinden, können Sie eine Löschanfrage stellen. Diese wird als Aufgabe an das Admin-Team weitergeleitet, das den Fall prüft und entscheidet.' },
  { q: 'Werden meine Kontaktdaten geschützt?', a: 'Ja. Ein automatischer Inhaltsfilter erkennt und ersetzt Telefonnummern, E-Mail-Adressen, URLs, Kanzleinamen und Adressen in Profilfeldern durch "J. L." — so wird verhindert, dass Mandanten die Plattform umgehen.' },
]

const tabs: { key: Tab; emoji: string; label: string }[] = [
  { key: 'allgemein', emoji: '❓', label: 'Allgemein' },
  { key: 'privat', emoji: '👤', label: 'Private Mandanten' },
  { key: 'b2b', emoji: '🏢', label: 'Unternehmen (B2B)' },
  { key: 'anwalt', emoji: '⚖️', label: 'Anwälte' },
]

const faqMap: Record<Tab, FAQ[]> = { allgemein: allgemeinFAQs, privat: privatFAQs, b2b: b2bFAQs, anwalt: anwaltFAQs }

export default function FAQPage() {
  const [tab, setTab] = useState<Tab>('allgemein')
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const faqs = faqMap[tab]

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 to-white">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-navy-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-navy-800"><span className="text-gold-500">Juri</span>Legal</Link>
          <div className="flex gap-3">
            <Link href="/so-funktionierts" className="px-4 py-2 text-sm text-navy-600 hover:text-navy-800">So funktioniert&apos;s</Link>
            <Link href="/register" className="px-4 py-2 bg-gold-400 text-white rounded-xl text-sm font-medium hover:bg-gold-500">Registrieren</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-wider">Hilfe & Support</span>
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mt-2 mb-4">Häufig gestellte Fragen</h1>
          <p className="text-lg text-navy-500 max-w-2xl mx-auto">Finden Sie Antworten auf die wichtigsten Fragen — passend zu Ihrer Nutzergruppe.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setOpenIdx(null) }}
              className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                tab === t.key ? 'bg-navy-800 text-white shadow-lg' : 'bg-white text-navy-600 border border-navy-200 hover:border-navy-300'
              }`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* FAQ Count */}
        <p className="text-sm text-navy-400 text-center mb-8">{faqs.length} Fragen in dieser Kategorie</p>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <div key={i} className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-gold-300 shadow-lg' : 'border-navy-100'}`}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer">
                  <span className={`font-semibold pr-4 ${isOpen ? 'text-gold-600' : 'text-navy-800'}`}>{faq.q}</span>
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-gold-500' : 'text-navy-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6">
                    <p className="text-navy-500 leading-relaxed">{faq.a}</p>
                    {faq.screenshot && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-navy-100 shadow-md">
                        <Image src={faq.screenshot} alt={faq.q} width={900} height={500} className="w-full h-auto" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center bg-navy-50 rounded-3xl p-10">
          <h2 className="text-2xl font-bold text-navy-900 mb-3">Frage nicht gefunden?</h2>
          <p className="text-navy-500 mb-6">Unser Support-Team hilft Ihnen gerne weiter.</p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-6 py-3 bg-gold-400 text-white rounded-xl font-semibold hover:bg-gold-500">
              Kostenlos registrieren
            </Link>
            <Link href="mailto:support@juri-legal.com" className="px-6 py-3 bg-white text-navy-700 rounded-xl font-semibold border border-navy-200 hover:border-navy-300">
              ✉️ Support kontaktieren
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-navy-100 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-navy-400">© 2026 JuriLegal. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6 text-sm text-navy-400">
            <Link href="/impressum" className="hover:text-navy-600">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-navy-600">Datenschutz</Link>
            <Link href="/agb" className="hover:text-navy-600">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
