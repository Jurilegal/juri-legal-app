export const metadata = {
  title: 'AGB | Juri Legal',
}

export default function AGBPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Allgemeine Geschäftsbedingungen</h1>

      <div className="space-y-4 text-navy-600">
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Online-Plattform Juri Legal
            (nachfolgend &quot;Plattform&quot;), betrieben von der Juri Legal GmbH (i.G.), Musterstraße 1, 10115 Berlin
            (nachfolgend &quot;Betreiber&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 2 Vertragsgegenstand</h2>
          <p>
            Die Plattform vermittelt Rechtsberatungen zwischen registrierten Mandanten und verifizierten Rechtsanwälten.
            Der Betreiber ist selbst nicht Vertragspartner der Beratungsleistung. Das Vertragsverhältnis über die
            Rechtsberatung kommt direkt zwischen Mandant und Anwalt zustande.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 3 Registrierung</h2>
          <p>
            Die Nutzung der Plattform erfordert eine Registrierung. Der Nutzer verpflichtet sich, wahrheitsgemäße
            Angaben zu machen. Jeder Nutzer darf nur ein Konto erstellen. Anwälte müssen ihre Zulassung nachweisen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 4 Preise und Zahlung</h2>
          <p>
            Die Beratung wird minutengenau abgerechnet. Der jeweilige Minutenpreis wird vom Anwalt festgelegt
            und vor Beratungsbeginn angezeigt. Die Registrierung ist kostenlos. Es gibt keine Mindestlaufzeiten
            oder Abonnements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 5 Pflichten der Nutzer</h2>
          <p>Nutzer verpflichten sich:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Die Plattform nicht missbräuchlich zu nutzen</li>
            <li>Keine rechtswidrigen Inhalte zu verbreiten</li>
            <li>Ihre Zugangsdaten vertraulich zu behandeln</li>
            <li>Keine automatisierten Zugriffe durchzuführen</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 6 Haftung</h2>
          <p>
            Der Betreiber haftet nicht für die Qualität der über die Plattform erbrachten Rechtsberatung.
            Die Haftung des Betreibers ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 7 Kündigung</h2>
          <p>
            Beide Parteien können das Nutzungsverhältnis jederzeit ohne Angabe von Gründen kündigen.
            Bereits gebuchte und bezahlte Beratungen bleiben hiervon unberührt.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mt-8 mb-3">§ 8 Schlussbestimmungen</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Berlin.
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit
            der übrigen Bestimmungen unberührt.
          </p>
        </section>

        <p className="text-sm text-navy-400 mt-8">Stand: März 2026</p>
      </div>
    </div>
  )
}
