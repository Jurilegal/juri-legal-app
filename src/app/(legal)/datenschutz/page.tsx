export const metadata = {
  title: 'Datenschutzerklärung | Juri Legal',
}

export default function DatenschutzPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Datenschutzerklärung</h1>

      <div className="space-y-4 text-navy-600">
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-lg font-medium text-navy-700 mt-4 mb-2">Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert,
            wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">2. Verantwortliche Stelle</h2>
          <p>
            Juri Legal GmbH (i.G.)<br />
            Musterstraße 1<br />
            10115 Berlin<br />
            E-Mail: datenschutz@juri-legal.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">3. Datenerfassung auf dieser Website</h2>
          <h3 className="text-lg font-medium text-navy-700 mt-4 mb-2">Cookies</h3>
          <p>
            Unsere Website verwendet Cookies. Diese sind zum Teil technisch notwendig (z.B. für die Authentifizierung),
            zum Teil dienen sie zur Verbesserung der Nutzererfahrung. Technisch notwendige Cookies werden auf Grundlage
            von Art. 6 Abs. 1 lit. f DSGVO gespeichert.
          </p>

          <h3 className="text-lg font-medium text-navy-700 mt-4 mb-2">Server-Log-Dateien</h3>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien,
            die Ihr Browser automatisch an uns übermittelt. Dies sind: Browsertyp und -version, verwendetes Betriebssystem,
            Referrer URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">4. Registrierung und Nutzerkonto</h2>
          <p>
            Bei der Registrierung erheben wir folgende Daten: Vorname, Nachname, E-Mail-Adresse. Diese Daten werden
            für die Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO verarbeitet. Bei Anwälten werden zusätzlich
            berufsbezogene Daten (Fachgebiete, Zulassungsnachweise) erhoben.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">5. Hosting</h2>
          <p>
            Diese Website wird bei Vercel Inc. gehostet. Die Datenbank wird bei Supabase Inc. betrieben.
            Beide Dienste verarbeiten Daten gemäß ihren Datenschutzrichtlinien und unter Einhaltung der DSGVO.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">6. Ihre Rechte</h2>
          <p>Sie haben jederzeit das Recht auf:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
        </section>

        <p className="text-sm text-navy-400 mt-8">Stand: März 2026</p>
      </div>
    </div>
  )
}
