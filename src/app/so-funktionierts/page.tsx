'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Tab = 'privat' | 'b2b' | 'anwalt'

interface Feature {
  title: string
  desc: string
  screenshot: string
  details: string[]
}

const privatFeatures: Feature[] = [
  {
    title: '1. Registrierung & Anmeldung',
    desc: 'Erstellen Sie in wenigen Sekunden ein kostenloses Konto. Keine versteckten Kosten — Sie zahlen nur, wenn Sie eine Beratung starten.',
    screenshot: '/screenshots/login.png',
    details: [
      '✅ Kostenlose Registrierung mit E-Mail und Passwort',
      '✅ Sichere Verifizierung per Double-Opt-In E-Mail',
      '✅ Wahl zwischen Privat- oder Geschäftskonto',
      '✅ Datenschutzkonform nach DSGVO',
    ],
  },
  {
    title: '2. Ihr persönliches Dashboard',
    desc: 'Nach dem Login gelangen Sie zu Ihrem übersichtlichen Dashboard. Hier sehen Sie alle wichtigen Informationen auf einen Blick.',
    screenshot: '/screenshots/mandant-dashboard.png',
    details: [
      '📊 Übersicht aller laufenden und vergangenen Beratungen',
      '💰 Juri-Coin-Guthaben immer im Blick',
      '⭐ Ihre abgegebenen Bewertungen',
      '🔔 Benachrichtigungen über neue Nachrichten',
    ],
  },
  {
    title: '3. Anwalt finden',
    desc: 'Durchsuchen Sie unsere verifizierten Anwälte nach Fachgebiet, Stadt, Preis und Bewertung. Finden Sie den perfekten Anwalt für Ihr Anliegen.',
    screenshot: '/screenshots/anwaelte-suche.png',
    details: [
      '🔍 Suchfilter: Fachgebiet, Stadt, Sprache, Minutenpreis',
      '⭐ Sortierung nach Bewertung und Erfahrung',
      '🟢 Verfügbarkeits-Anzeige in Echtzeit',
      '📋 Detaillierte Anwaltsprofile mit Qualifikationen',
    ],
  },
  {
    title: '4. Beratungen & Chat',
    desc: 'Starten Sie eine Beratung per Chat oder Video — abgerechnet wird fair pro Minute. Kein Abo, keine Mindestlaufzeit.',
    screenshot: '/screenshots/mandant-beratungen.png',
    details: [
      '💬 Echtzeit-Chat mit Ihrem Anwalt',
      '📹 Video-Beratung für persönliche Gespräche',
      '⏱️ Transparente Minutenabrechnung',
      '📄 Vollständige Beratungshistorie',
      '🔒 Ende-zu-Ende verschlüsselt',
    ],
  },
  {
    title: '5. Juri Coins — Ihr Guthaben',
    desc: 'Laden Sie Juri Coins auf und nutzen Sie diese für Beratungen. 1 Coin = 1 Euro. Bonus: 20 Coins geschenkt bei Newsletter-Anmeldung!',
    screenshot: '/screenshots/mandant-coins.png',
    details: [
      '🪙 Einfaches Aufladen per Kreditkarte (Stripe)',
      '🎁 20 Coins Willkommensbonus bei Newsletter-Anmeldung',
      '📊 Komplette Transaktionshistorie',
      '💳 Sichere Zahlungsabwicklung über Stripe',
    ],
  },
  {
    title: '6. Bewertungen & Qualitätskontrolle',
    desc: 'Nach jeder Beratung können Sie Ihren Anwalt bewerten. Bei weniger als 3 Sternen ist ein Kommentar Pflicht — so stellen wir Qualität sicher.',
    screenshot: '/screenshots/mandant-bewertungen.png',
    details: [
      '⭐ 1–5 Sterne Bewertungssystem',
      '📝 Pflicht-Kommentar bei < 3 Sternen',
      '🎁 2 Gratis-Minuten als Dankeschön für jede Bewertung',
      '🛡️ Nur verifizierte Beratungen können bewertet werden',
    ],
  },
  {
    title: '7. Zahlungen & Rechnungen',
    desc: 'Volle Transparenz über alle Zahlungen. Fordern Sie Rechnungen an, sehen Sie Zahlungshistorie und verwalten Sie Zahlungsmethoden.',
    screenshot: '/screenshots/mandant-zahlungen.png',
    details: [
      '💳 Zahlungsmethoden verwalten (Kreditkarte, SEPA)',
      '🧾 Rechnungsanforderung per Klick (einzeln oder Sammelrechnung)',
      '📊 Komplette Zahlungshistorie',
      '⚖️ Streitfall-System: Bis zu 3 Tage nach Beratung anfechten',
    ],
  },
]

const b2bFeatures: Feature[] = [
  {
    title: '1. Geschäftskonto erstellen',
    desc: 'Registrieren Sie Ihr Unternehmen mit USt-IdNr. und erhalten Sie Zugang zu allen B2B-Funktionen inkl. Sammelrechnungen.',
    screenshot: '/screenshots/login.png',
    details: [
      '🏢 Geschäftskonto mit Firmenname und USt-IdNr.',
      '📄 Automatische Rechnungsstellung mit Umsatzsteuer-Ausweis',
      '👥 Mehrere Mitarbeiter unter einem Firmenkonto (geplant)',
      '✅ DSGVO-konform mit Auftragsverarbeitungsvertrag (AVV)',
    ],
  },
  {
    title: '2. B2B-Dashboard',
    desc: 'Das Geschäftskunden-Dashboard bietet erweiterte Funktionen für Unternehmen: Abteilungsbudgets, Sammelrechnungen und Kostenübersicht.',
    screenshot: '/screenshots/mandant-dashboard.png',
    details: [
      '📊 Kostenübersicht nach Abteilung/Projekt',
      '💰 Juri-Coin-Guthaben für das gesamte Unternehmen',
      '📋 Beratungshistorie mit Export-Funktion',
      '🔔 Zentrale Benachrichtigungen',
    ],
  },
  {
    title: '3. Anwälte nach Fachgebiet filtern',
    desc: 'Finden Sie spezialisierte Anwälte für Ihr Unternehmen — ob Arbeitsrecht, Handelsrecht, IT-Recht oder Datenschutz.',
    screenshot: '/screenshots/anwaelte-suche.png',
    details: [
      '⚖️ Filter nach Rechtsgebiet (Arbeitsrecht, Handelsrecht, etc.)',
      '🌍 Mehrsprachige Anwälte für internationale Unternehmen',
      '💼 Erfahrungsjahre und Spezialisierung sichtbar',
      '📞 Sofort verfügbare Anwälte für dringende Fälle',
    ],
  },
  {
    title: '4. Beratungen für Ihr Unternehmen',
    desc: 'Starten Sie Beratungen für verschiedene Abteilungen. Jede Beratung wird dokumentiert und ist nachvollziehbar.',
    screenshot: '/screenshots/mandant-beratungen.png',
    details: [
      '💬 Chat- und Video-Beratung',
      '📁 Beratungen nach Projekt/Abteilung organisieren',
      '📊 Paginierte Übersicht (50 pro Seite)',
      '📥 CSV-Export für die Buchhaltung',
      '🧾 Sammelrechnung per Klick (Checkboxen + Alle auswählen)',
    ],
  },
  {
    title: '5. Coin-System & Budgets',
    desc: 'Laden Sie Guthaben zentral auf und verwalten Sie Budgets für Ihr Unternehmen. Transparente Kostenkontrolle.',
    screenshot: '/screenshots/mandant-coins.png',
    details: [
      '🪙 Zentrale Coin-Aufladung per Firmenkreditkarte',
      '📊 Transaktionshistorie für die Buchhaltung',
      '💳 Stripe-Integration mit Rechnungsadresse',
      '🎁 20 Coins Bonus bei Newsletter-Anmeldung',
    ],
  },
  {
    title: '6. Rechnungen & Buchhaltung',
    desc: 'Fordern Sie professionelle Rechnungen an — einzeln oder als Sammelrechnung. Mit USt-Ausweis für Ihren Steuerberater.',
    screenshot: '/screenshots/mandant-zahlungen.png',
    details: [
      '🧾 Einzelrechnung oder Sammelrechnung per Klick',
      '💼 USt-IdNr. auf allen Rechnungen',
      '📥 PDF-Download und E-Mail-Versand',
      '⚖️ Streitfall-System mit 3-Tage-Frist',
      '📊 Komplette Zahlungshistorie mit Filter',
    ],
  },
]

const anwaltFeatures: Feature[] = [
  {
    title: '1. Registrierung & Verifizierung',
    desc: 'Registrieren Sie sich als Anwalt und durchlaufen Sie unseren Verifizierungsprozess. Nach Prüfung Ihrer Zulassung werden Sie freigeschaltet.',
    screenshot: '/screenshots/login.png',
    details: [
      '📋 Registrierung mit Anwaltsnachweis',
      '📄 Upload: Anwaltszulassung + Identitätsnachweis',
      '✅ Manuelle Prüfung durch JuriLegal-Team',
      '🌍 Länderspezifische Dokumente (DE/FR/IT)',
    ],
  },
  {
    title: '2. Anwalts-Dashboard',
    desc: 'Ihr Cockpit: Onboarding-Fortschritt, aktuelle Statistiken, neue Beratungsanfragen und Einnahmen auf einen Blick.',
    screenshot: '/screenshots/anwalt-dashboard.png',
    details: [
      '📊 SVG-Fortschrittsanzeige für 6-Punkte-Onboarding',
      '💰 Einnahmen-Übersicht (Brutto/Netto/Gebühr)',
      '⭐ Bewertungsdurchschnitt und Anzahl',
      '📈 Beratungsstatistiken',
      '🔔 Neue Anfragen und Benachrichtigungen',
    ],
  },
  {
    title: '3. Profil bearbeiten',
    desc: 'Gestalten Sie Ihr öffentliches Profil: Fachgebiete, Bio, Profilbild, Erfahrung. Ein starkes Profil bringt mehr Mandanten.',
    screenshot: '/screenshots/anwalt-profil.png',
    details: [
      '📸 Avatar-Upload (Supabase Storage)',
      '📝 Headline, Bio, Fachgebiete, Sprachen',
      '🏙️ Stadt und Erfahrungsjahre',
      '🛡️ Automatischer Inhaltsfilter (keine Kontaktdaten)',
      '🌍 Länderspezifische Dokumentenanforderungen',
    ],
  },
  {
    title: '4. Verfügbarkeit & Zeitslots',
    desc: 'Legen Sie Ihre Verfügbarkeit fest: Wiederkehrende Zeitfenster, Abwesenheiten/Urlaub und Kommunikationskanäle.',
    screenshot: '/screenshots/anwalt-verfuegbarkeit.png',
    details: [
      '🕐 Wiederkehrende Zeitslots pro Wochentag',
      '🏖️ Abwesenheiten und Urlaubsplanung',
      '💬 Kommunikationskanal-Toggles (Chat/Video)',
      '📅 Google Calendar Integration (Platzhalter)',
      '🟢 Ein-Klick-Verfügbarkeits-Toggle',
    ],
  },
  {
    title: '5. Beratungen verwalten',
    desc: 'Alle Ihre Beratungen paginiert und filterbar. Exportieren Sie Daten für Ihre Buchhaltung.',
    screenshot: '/screenshots/anwalt-beratungen.png',
    details: [
      '📋 Paginierte Liste (50 pro Seite)',
      '📅 Monatsfilter für gezielte Ansicht',
      '📥 CSV-Export (nur monatsweise)',
      '💬 Beratungsdetails und Chat-Verlauf',
      '📊 Status-Tracking (aktiv/abgeschlossen/storniert)',
    ],
  },
  {
    title: '6. Einnahmen & Finanzen',
    desc: 'Transparente Finanzübersicht: Brutto, Netto, Plattformgebühr. Monatliche CSV-Exports für den Steuerberater.',
    screenshot: '/screenshots/anwalt-einnahmen.png',
    details: [
      '💰 Brutto/Netto/Gebühr-Karten auf einen Blick',
      '📊 Monatsauswahl per Dropdown',
      '📥 CSV-Export für jeden Monat',
      '5️⃣ Transparente 5% Plattformgebühr',
    ],
  },
  {
    title: '7. Preise konfigurieren',
    desc: 'Legen Sie getrennte Minutenpreise für Chat und Video fest. Live-Vorschau zeigt Ihre Einnahmen. Doppelte Bestätigung schützt vor Versehen.',
    screenshot: '/screenshots/anwalt-preise.png',
    details: [
      '💬 Separater Chat-Minutenpreis',
      '📹 Separater Video-Minutenpreis',
      '📊 Live-Balkendiagramm mit Einnahmenvorschau',
      '🔐 Double-Opt-In: Button → Modal → Bestätigung',
      '📜 Preishistorie wird gespeichert',
    ],
  },
  {
    title: '8. Bewertungen & Reputation',
    desc: 'Sehen Sie alle Bewertungen Ihrer Mandanten. Bei unfairen Bewertungen können Sie eine Löschung beantragen.',
    screenshot: '/screenshots/anwalt-bewertungen.png',
    details: [
      '⭐ Alle Bewertungen mit Sternzahl und Kommentar',
      '📊 Durchschnittsbewertung und Gesamtzahl',
      '🗑️ Löschanfrage bei unfairen Bewertungen → Admin prüft',
      '🎁 2 Gratis-Minuten pro erhaltener Bewertung',
    ],
  },
  {
    title: '9. Abo & All-in-One Kanzlei',
    desc: 'Wählen Sie zwischen Basic (kostenlos) und dem All-in-One Kanzlei-Paket (149€/Monat) mit allen digitalen Kanzlei-Tools.',
    screenshot: '/screenshots/anwalt-abo.png',
    details: [
      '🆓 Basic: JuriLegal-Plattform kostenlos nutzen',
      '🏛️ All-in-One: Komplette digitale Kanzlei',
      '🎉 Early Adopter: Erste 500 Anwälte = 12 Monate gratis',
      '📄 AVV (Auftragsverarbeitungsvertrag) digital unterschreiben',
      '💳 Stripe-Abo mit monatlicher Abrechnung',
    ],
  },
  {
    title: '10. Kanzlei-Dashboard (All-in-One)',
    desc: 'Die Zentrale Ihrer digitalen Kanzlei: KPI-Übersicht, Schnellzugriff auf alle Module, offene Fristen und Umsatz.',
    screenshot: '/screenshots/anwalt-kanzlei.png',
    details: [
      '📊 KPI-Cards: Akten, Fristen, offene Stunden, Mandanten',
      '⚠️ Überfällige Fristen sofort sichtbar',
      '💰 Offener Umsatz aus nicht abgerechneten Stunden',
      '🔗 Modul-Grid mit Schnellzugriff auf alle Tools',
    ],
  },
  {
    title: '11. Digitale Akten',
    desc: 'Erstellen und verwalten Sie Ihre Akten digital. Dokumente hochladen, Aktenzeichen vergeben, nach Status filtern.',
    screenshot: '/screenshots/anwalt-akten.png',
    details: [
      '📁 Akten anlegen mit Titel, Aktenzeichen, Rechtsgebiet',
      '📤 Dokumente hochladen (beliebige Dateitypen)',
      '🔍 Volltextsuche über Akten',
      '📊 Status: Offen, In Bearbeitung, Abgeschlossen, Archiviert',
      '👤 Gegner-Zuordnung',
    ],
  },
  {
    title: '12. Kanzlei-Mandanten',
    desc: 'Verwalten Sie Ihre Kanzlei-Mandanten getrennt von der JuriLegal-Plattform. Privat- und Geschäftskunden.',
    screenshot: '/screenshots/anwalt-mandanten.png',
    details: [
      '👤 Privatkunden und 🏢 Geschäftskunden',
      '📋 Stammdaten: Name, Adresse, E-Mail, Telefon',
      '🔍 Suchfunktion über alle Mandanten',
      '📝 Notizen pro Mandant',
      '✏️ Inline-Bearbeitung per Klick',
    ],
  },
  {
    title: '13. Fristen & Aufgaben',
    desc: 'Überwachen Sie alle Fristen und planen Sie Aufgaben. Überfällige Fristen werden rot markiert.',
    screenshot: '/screenshots/anwalt-fristen.png',
    details: [
      '📅 Fristen-Tab: Fälligkeitsdatum, Priorität, Checkbox',
      '✅ Aufgaben-Tab: To-Do-Liste mit Status',
      '🔴 Überfällige Fristen visuell hervorgehoben',
      '⚡ Prioritäten: Kritisch, Hoch, Normal, Niedrig',
      '📌 Akten-Zuordnung möglich',
    ],
  },
  {
    title: '14. Zeiterfassung & Timer',
    desc: 'Erfassen Sie Ihre Arbeitszeit live per Timer oder manuell. Stundensätze hinterlegen, offenen Umsatz berechnen.',
    screenshot: '/screenshots/anwalt-zeiterfassung.png',
    details: [
      '⏱️ Live-Timer mit Start/Stopp',
      '📝 Manuelle Zeiterfassung mit Tätigkeit und Datum',
      '💰 Stundensatz pro Eintrag (Standard: 250€)',
      '📊 Offene Stunden und offener Umsatz auf einen Blick',
      '🧾 Einträge direkt in Rechnungen überführen',
    ],
  },
  {
    title: '15. Rechnungen erstellen',
    desc: 'Erstellen Sie Rechnungen aus Ihren Zeiteinträgen. Mandant zuordnen, MwSt. automatisch berechnen, Status verfolgen.',
    screenshot: '/screenshots/anwalt-rechnungen.png',
    details: [
      '🧾 Rechnungen aus offenen Zeiteinträgen generieren',
      '👤 Mandantenzuordnung per Dropdown',
      '📊 Automatische MwSt.-Berechnung (19%)',
      '📋 Status-Tracking: Entwurf → Versendet → Bezahlt',
      '💰 Gesamt-Statistik: offen, bezahlt, überfällig',
    ],
  },
  {
    title: '16. Juristische Recherche',
    desc: 'Durchsuchen Sie Urteile, Beschlüsse und Gesetze direkt in JuriLegal. Powered by juris — nahtlos integriert.',
    screenshot: '/screenshots/anwalt-recherche.png',
    details: [
      '🔍 Volltextsuche nach Rechtsbegriffen und Aktenzeichen',
      '⚖️ Filter: Rechtsgebiet, Dokumenttyp, Jahr',
      '📋 Ergebnisliste mit Gericht, Referenz und Zusammenfassung',
      '📄 Detail-Ansicht mit Volltext (juris-API)',
    ],
  },
  {
    title: '17. beA-Postfach',
    desc: 'Elektronischer Rechtsverkehr direkt in JuriLegal. Empfangen und senden Sie beA-Nachrichten.',
    screenshot: '/screenshots/anwalt-bea.png',
    details: [
      '📥 Eingang: Alle eingehenden beA-Nachrichten',
      '📤 Ausgang: Versendete Nachrichten',
      '📝 Entwürfe: Nachrichten vorbereiten',
      '✉️ Neue Nachricht an beA-SAFE-ID senden',
      '🔒 Erfordert gültige beA-Karte',
    ],
  },
  {
    title: '18. DATEV-Export',
    desc: 'Exportieren Sie alle abrechnungsrelevanten Daten im offiziellen DATEV-Format für Ihren Steuerberater.',
    screenshot: '/screenshots/anwalt-datev.png',
    details: [
      '📥 CSV-Download im DATEV Buchungsstapel-Format',
      '📅 Zeitraum frei wählbar (Von/Bis)',
      '🧾 Enthält: Rechnungen, Zeiteinträge, Mandanten, USt.',
      '✅ Kompatibel mit DATEV Unternehmen online',
    ],
  },
  {
    title: '19. Migration von anderer Software',
    desc: '5-Schritte-Wizard: Importieren Sie Ihre Daten aus RA-MICRO, Actaport, Kleos, Advoware oder AnNoText.',
    screenshot: '/screenshots/anwalt-migration.png',
    details: [
      '1️⃣ Tool-Auswahl: RA-MICRO, Actaport, Kleos, Advoware, AnNoText',
      '2️⃣ Automatische Daten-Analyse (Akten, Dokumente, Kontakte)',
      '3️⃣ Interaktives Feld-Mapping mit Auto-Zuordnung',
      '4️⃣ Live-Fortschrittsanzeige während der Migration',
      '5️⃣ Abschlussbericht mit Fehlerprotokoll',
    ],
  },
]

function FeatureCard({ f, idx }: { f: Feature; idx: number }) {
  const isEven = idx % 2 === 0
  return (
    <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}>
      <div className="flex-1 min-w-0">
        <h3 className="text-2xl font-bold text-navy-800 mb-3">{f.title}</h3>
        <p className="text-navy-500 mb-4 leading-relaxed">{f.desc}</p>
        <ul className="space-y-2">
          {f.details.map((d, i) => (
            <li key={i} className="text-sm text-navy-600">{d}</li>
          ))}
        </ul>
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-navy-100">
          <Image src={f.screenshot} alt={f.title} width={700} height={450} className="w-full h-auto" />
        </div>
      </div>
    </div>
  )
}

export default function SoFunktionierts() {
  const [tab, setTab] = useState<Tab>('privat')

  const features = tab === 'privat' ? privatFeatures : tab === 'b2b' ? b2bFeatures : anwaltFeatures
  const tabConfig = {
    privat: { emoji: '👤', title: 'Für Private Mandanten', subtitle: 'Sofortige Rechtsberatung — einfach, transparent und sicher.' },
    b2b: { emoji: '🏢', title: 'Für Unternehmen (B2B)', subtitle: 'Professionelle Rechtsberatung für Ihr Unternehmen — mit Rechnungsstellung und Kostenkontrolle.' },
    anwalt: { emoji: '⚖️', title: 'Für Anwälte', subtitle: 'Ihre digitale Kanzlei: Von der Beratung über Aktenverwaltung bis zum DATEV-Export.' },
  }

  const cfg = tabConfig[tab]

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 to-white">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-navy-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-navy-800">
            <span className="text-gold-500">Juri</span>Legal
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-navy-600 hover:text-navy-800">Anmelden</Link>
            <Link href="/register" className="px-4 py-2 bg-gold-400 text-white rounded-xl text-sm font-medium hover:bg-gold-500">Registrieren</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">So funktioniert&apos;s</h1>
          <p className="text-lg text-navy-500 max-w-2xl mx-auto">
            Entdecken Sie alle Funktionen von JuriLegal — angepasst an Ihre Bedürfnisse.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          {([
            { key: 'privat' as Tab, emoji: '👤', label: 'Private Mandanten', sub: 'Rechtsberatung für Privatpersonen' },
            { key: 'b2b' as Tab, emoji: '🏢', label: 'Unternehmen (B2B)', sub: 'Rechtsberatung für Firmen' },
            { key: 'anwalt' as Tab, emoji: '⚖️', label: 'Anwälte', sub: 'Ihre digitale Kanzlei' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 max-w-xs p-6 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                tab === t.key
                  ? 'border-gold-400 bg-gold-50 shadow-lg'
                  : 'border-navy-200 bg-white hover:border-navy-300'
              }`}
            >
              <span className="text-3xl block mb-2">{t.emoji}</span>
              <span className="font-bold text-navy-800 block">{t.label}</span>
              <span className="text-sm text-navy-400">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-5xl block mb-4">{cfg.emoji}</span>
          <h2 className="text-3xl font-bold text-navy-900 mb-2">{cfg.title}</h2>
          <p className="text-navy-500">{cfg.subtitle}</p>
        </div>

        {/* Features */}
        <div className="space-y-24">
          {features.map((f, i) => (
            <FeatureCard key={i} f={f} idx={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-gradient-to-r from-navy-800 to-navy-900 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Bereit loszulegen?</h2>
          <p className="text-navy-300 mb-8 max-w-lg mx-auto">
            {tab === 'anwalt'
              ? 'Registrieren Sie sich als Anwalt und starten Sie Ihre digitale Kanzlei.'
              : 'Registrieren Sie sich kostenlos und finden Sie sofort den passenden Anwalt.'}
          </p>
          <div className="flex justify-center gap-4">
            <Link href={tab === 'anwalt' ? '/register/anwalt' : '/register/mandant'}
              className="px-8 py-3 bg-gold-400 text-white rounded-xl font-semibold hover:bg-gold-500 transition-all">
              Jetzt registrieren
            </Link>
            <Link href="/anwaelte"
              className="px-8 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
              Anwälte ansehen
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-navy-100 mt-24 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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
