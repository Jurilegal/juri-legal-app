// RVG-Gebührentabelle (Stand 2024, KostRÄG)
// Gegenstandswert → einfache Gebühr
const RVG_TABLE: [number, number][] = [
  [500, 49], [1000, 88], [1500, 127], [2000, 166], [3000, 222],
  [4000, 278], [5000, 334], [6000, 390], [7000, 446], [8000, 502],
  [9000, 558], [10000, 614], [13000, 666], [16000, 718], [19000, 770],
  [22000, 822], [25000, 874], [30000, 955], [35000, 1036], [40000, 1117],
  [45000, 1198], [50000, 1279], [65000, 1373], [80000, 1467], [95000, 1561],
  [110000, 1655], [125000, 1749], [140000, 1843], [155000, 1937], [170000, 2031],
  [185000, 2125], [200000, 2219], [230000, 2351], [260000, 2483], [290000, 2615],
  [320000, 2747], [350000, 2879], [380000, 3011], [410000, 3143], [440000, 3275],
  [470000, 3407], [500000, 3539],
]

// GKG-Gerichtskosten (vereinfacht, Gebührentabelle B)
const GKG_TABLE: [number, number][] = [
  [500, 38], [1000, 58], [1500, 78], [2000, 98], [3000, 119],
  [4000, 140], [5000, 161], [6000, 182], [7000, 203], [8000, 224],
  [9000, 245], [10000, 266], [13000, 295], [16000, 324], [19000, 353],
  [22000, 382], [25000, 411], [30000, 449], [35000, 487], [40000, 525],
  [45000, 563], [50000, 601], [65000, 733], [80000, 865], [95000, 997],
  [110000, 1129], [125000, 1261], [140000, 1393], [155000, 1525], [170000, 1657],
  [185000, 1789], [200000, 1921], [230000, 2119], [260000, 2317], [290000, 2515],
  [320000, 2713], [350000, 2911], [380000, 3109], [410000, 3307], [440000, 3505],
  [470000, 3703], [500000, 3901],
]

export function getSimpleFee(value: number): number {
  for (const [limit, fee] of RVG_TABLE) {
    if (value <= limit) return fee
  }
  const extra = Math.ceil((value - 500000) / 50000) * 160
  return 3539 + extra
}

export function getGKGFee(value: number): number {
  for (const [limit, fee] of GKG_TABLE) {
    if (value <= limit) return fee
  }
  const extra = Math.ceil((value - 500000) / 50000) * 198
  return 3901 + extra
}

export interface RVGItem { label: string; vvNr: string; factor: number; amount: number }

export interface RVGCalculation {
  gegenstandswert: number
  einfacheGebuehr: number
  items: RVGItem[]
  zwischensumme: number
  auslagenpauschale: number
  erhoehungsgebuehr: number
  netto: number
  mwst: number
  brutto: number
  gerichtskosten?: number
  kostenausgleich?: { quote: number; eigenanteil: number; gegneranteil: number }
}

export type RVGType = 'beratung' | 'aussergerichtlich' | 'gericht' | 'berufung' | 'pkh' | 'mahnverfahren'

export interface RVGOptions {
  type: RVGType
  gegenstandswert: number
  anzahlAuftraggeber?: number // Erhöhungsgebühr
  mitEinigung?: boolean
  pkh?: boolean // Prozesskostenhilfe
  obsiegensquote?: number // 0-100, für Kostenausgleichung
  mitGerichtskosten?: boolean
}

export function calculateRVG(gegenstandswert: number, type: RVGType | 'aussergerichtlich' | 'gericht' | 'beratung', options?: Partial<RVGOptions>): RVGCalculation {
  const fee = getSimpleFee(gegenstandswert)
  const items: RVGItem[] = []
  const opts = { anzahlAuftraggeber: 1, mitEinigung: type === 'aussergerichtlich', pkh: false, obsiegensquote: 100, mitGerichtskosten: type === 'gericht' || type === 'berufung', ...options }

  switch (type) {
    case 'beratung':
      items.push({ label: 'Erstberatungsgebühr (Verbraucher)', vvNr: '§ 34 Abs. 1 S. 3 RVG', factor: 1.0, amount: Math.min(fee, 190) })
      break

    case 'aussergerichtlich':
      items.push({ label: 'Geschäftsgebühr', vvNr: 'Nr. 2300 VV RVG', factor: 1.3, amount: round(fee * 1.3) })
      if (opts.mitEinigung)
        items.push({ label: 'Einigungsgebühr', vvNr: 'Nr. 1000 VV RVG', factor: 1.5, amount: round(fee * 1.5) })
      break

    case 'gericht':
      items.push({ label: 'Verfahrensgebühr', vvNr: 'Nr. 3100 VV RVG', factor: 1.3, amount: round(fee * 1.3) })
      items.push({ label: 'Terminsgebühr', vvNr: 'Nr. 3104 VV RVG', factor: 1.2, amount: round(fee * 1.2) })
      if (opts.mitEinigung)
        items.push({ label: 'Einigungsgebühr (gerichtl.)', vvNr: 'Nr. 1003 VV RVG', factor: 1.0, amount: fee })
      break

    case 'berufung':
      items.push({ label: 'Verfahrensgebühr Berufung', vvNr: 'Nr. 3200 VV RVG', factor: 1.6, amount: round(fee * 1.6) })
      items.push({ label: 'Terminsgebühr Berufung', vvNr: 'Nr. 3202 VV RVG', factor: 1.2, amount: round(fee * 1.2) })
      break

    case 'pkh':
      items.push({ label: 'Verfahrensgebühr (PKH)', vvNr: 'Nr. 3100 VV RVG', factor: 1.3, amount: round(fee * 1.3) })
      items.push({ label: 'Terminsgebühr (PKH)', vvNr: 'Nr. 3104 VV RVG', factor: 1.2, amount: round(fee * 1.2) })
      break

    case 'mahnverfahren':
      items.push({ label: 'Verfahrensgebühr Mahnverfahren', vvNr: 'Nr. 3305 VV RVG', factor: 1.0, amount: round(fee * 1.0) })
      break
  }

  // Erhöhungsgebühr (Nr. 1008 VV RVG) - pro weiterem Auftraggeber +30% der Verfahrensgebühr
  let erhoehungsgebuehr = 0
  if (opts.anzahlAuftraggeber > 1) {
    const procFee = items[0]?.amount || 0
    erhoehungsgebuehr = round(procFee * 0.3 * (opts.anzahlAuftraggeber - 1))
  }

  const zwischensumme = items.reduce((s, i) => s + i.amount, 0) + erhoehungsgebuehr

  // Auslagenpauschale (Nr. 7002 VV RVG)
  const auslagenpauschale = Math.min(round(zwischensumme * 0.2), 20)

  const netto = round(zwischensumme + auslagenpauschale)
  const mwst = round(netto * 0.19) // Nr. 7008 VV RVG
  const brutto = round(netto + mwst)

  const result: RVGCalculation = {
    gegenstandswert, einfacheGebuehr: fee, items, zwischensumme,
    auslagenpauschale, erhoehungsgebuehr, netto, mwst, brutto
  }

  // Gerichtskosten (GKG)
  if (opts.mitGerichtskosten) {
    const gkgFee = getGKGFee(gegenstandswert)
    result.gerichtskosten = gkgFee * 3 // 3-fache Gebühr für Klageverfahren
  }

  // Kostenausgleichung (§ 92 ZPO)
  if (opts.obsiegensquote !== undefined && opts.obsiegensquote < 100 && result.gerichtskosten) {
    const quote = opts.obsiegensquote / 100
    const totalCosts = brutto * 2 + result.gerichtskosten // beide Anwälte + Gericht
    result.kostenausgleich = {
      quote: opts.obsiegensquote,
      eigenanteil: round(totalCosts * (1 - quote)),
      gegneranteil: round(totalCosts * quote)
    }
  }

  return result
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
