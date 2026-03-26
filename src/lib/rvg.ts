// RVG-Gebührentabelle (vereinfacht, Stand 2024)
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

export function getSimpleFee(value: number): number {
  for (const [limit, fee] of RVG_TABLE) {
    if (value <= limit) return fee
  }
  // Above 500k: +160€ per 50k
  const extra = Math.ceil((value - 500000) / 50000) * 160
  return 3539 + extra
}

export interface RVGCalculation {
  gegenstandswert: number
  einfacheGebuehr: number
  items: { label: string; vvNr: string; factor: number; amount: number }[]
  zwischensumme: number
  auslagenpauschale: number
  netto: number
  mwst: number
  brutto: number
}

export function calculateRVG(gegenstandswert: number, type: 'beratung' | 'aussergerichtlich' | 'gericht'): RVGCalculation {
  const fee = getSimpleFee(gegenstandswert)
  const items: RVGCalculation['items'] = []

  if (type === 'beratung') {
    items.push({ label: 'Erstberatungsgebühr', vvNr: '§ 34 RVG', factor: 1.0, amount: Math.min(fee, 190) })
  } else if (type === 'aussergerichtlich') {
    items.push({ label: 'Geschäftsgebühr', vvNr: 'VV 2300', factor: 1.3, amount: Math.round(fee * 1.3 * 100) / 100 })
    items.push({ label: 'Einigungsgebühr', vvNr: 'VV 1000', factor: 1.5, amount: Math.round(fee * 1.5 * 100) / 100 })
  } else {
    items.push({ label: 'Verfahrensgebühr', vvNr: 'VV 3100', factor: 1.3, amount: Math.round(fee * 1.3 * 100) / 100 })
    items.push({ label: 'Terminsgebühr', vvNr: 'VV 3104', factor: 1.2, amount: Math.round(fee * 1.2 * 100) / 100 })
    items.push({ label: 'Einigungsgebühr', vvNr: 'VV 1003', factor: 1.0, amount: fee })
  }

  const zwischensumme = items.reduce((s, i) => s + i.amount, 0)
  const auslagenpauschale = Math.min(zwischensumme * 0.2, 20)
  const netto = Math.round((zwischensumme + auslagenpauschale) * 100) / 100
  const mwst = Math.round(netto * 0.19 * 100) / 100

  return { gegenstandswert, einfacheGebuehr: fee, items, zwischensumme, auslagenpauschale, netto, mwst, brutto: Math.round((netto + mwst) * 100) / 100 }
}
