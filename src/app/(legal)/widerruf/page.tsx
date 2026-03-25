export const metadata = {
  title: 'Widerrufsrecht | Juri Legal',
}

export default function WiderrufPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Widerrufsbelehrung</h1>

      <div className="space-y-4 text-navy-600">
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Widerrufsrecht</h2>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
          </p>
          <p className="mt-2">
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Juri Legal GmbH (i.G.), Musterstraße 1,
            10115 Berlin, E-Mail: info@juri-legal.com, Telefon: +49 (0) 30 1234567) mittels einer eindeutigen
            Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag
            zu widerrufen, informieren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Folgen des Widerrufs</h2>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben,
            unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung
            über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Besondere Hinweise</h2>
          <p>
            Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben
            Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns
            von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten
            Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">Muster-Widerrufsformular</h2>
          <div className="bg-navy-50 rounded-xl p-6 border border-navy-100">
            <p className="text-sm">
              An: Juri Legal GmbH (i.G.), Musterstraße 1, 10115 Berlin, info@juri-legal.com<br /><br />
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung
              der folgenden Dienstleistung:<br /><br />
              Bestellt am (*) / erhalten am (*):<br />
              Name des/der Verbraucher(s):<br />
              Anschrift des/der Verbraucher(s):<br />
              Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):<br />
              Datum:<br /><br />
              <span className="text-xs text-navy-400">(*) Unzutreffendes streichen.</span>
            </p>
          </div>
        </section>

        <p className="text-sm text-navy-400 mt-8">Stand: März 2026</p>
      </div>
    </div>
  )
}
