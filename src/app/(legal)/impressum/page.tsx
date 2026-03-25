export const metadata = {
  title: 'Impressum | Juri Legal',
}

export default function ImpressumPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Impressum</h1>

      <div className="space-y-4 text-navy-600">
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Angaben gemäß § 5 TMG</h2>
          <p>
            Juri Legal GmbH (i.G.)<br />
            Musterstraße 1<br />
            10115 Berlin<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Kontakt</h2>
          <p>
            Telefon: +49 (0) 30 1234567<br />
            E-Mail: info@juri-legal.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Vertretungsberechtigte</h2>
          <p>Geschäftsführer: [Name wird ergänzt]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Registereintrag</h2>
          <p>
            Eintragung im Handelsregister.<br />
            Registergericht: Amtsgericht Berlin-Charlottenburg<br />
            Registernummer: [wird ergänzt]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Umsatzsteuer-ID</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
            [wird ergänzt]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            [Name wird ergänzt]<br />
            Musterstraße 1<br />
            10115 Berlin
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p className="mt-2">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  )
}
