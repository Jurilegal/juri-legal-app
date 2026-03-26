// Fristenberechnung nach ZPO § 222 mit Feiertagen

function computeEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

export function getHolidays(year: number, bundesland = 'NRW'): Set<string> {
  const holidays = new Set<string>()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  // Fixed holidays
  holidays.add(`${year}-01-01`) // Neujahr
  holidays.add(`${year}-05-01`) // Tag der Arbeit
  holidays.add(`${year}-10-03`) // Tag der Deutschen Einheit
  holidays.add(`${year}-12-25`) // 1. Weihnachtsfeiertag
  holidays.add(`${year}-12-26`) // 2. Weihnachtsfeiertag

  // Easter-based
  const easter = computeEaster(year)
  holidays.add(fmt(addDays(easter, -2))) // Karfreitag
  holidays.add(fmt(addDays(easter, 1)))  // Ostermontag
  holidays.add(fmt(addDays(easter, 39))) // Christi Himmelfahrt
  holidays.add(fmt(addDays(easter, 50))) // Pfingstmontag

  // Bundesland-specific
  if (['BW', 'BY', 'HE', 'NRW', 'RP', 'SL'].includes(bundesland))
    holidays.add(fmt(addDays(easter, 60))) // Fronleichnam
  if (['BW', 'BY', 'SL'].includes(bundesland))
    holidays.add(`${year}-08-15`) // Mariä Himmelfahrt
  if (['BB', 'MV', 'SN', 'ST', 'TH'].includes(bundesland))
    holidays.add(`${year}-10-31`) // Reformationstag
  if (['BW', 'BY', 'NRW', 'RP', 'SL'].includes(bundesland))
    holidays.add(`${year}-11-01`) // Allerheiligen

  return holidays
}

// Check if date is a workday (not weekend, not holiday)
export function isWorkday(date: Date, bundesland = 'NRW'): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false // Weekend
  const holidays = getHolidays(date.getFullYear(), bundesland)
  return !holidays.has(date.toISOString().split('T')[0])
}

// Calculate Vorfrist (pre-deadline reminder)
// ZPO § 222: If deadline falls on weekend/holiday, it moves to next workday
export function adjustDeadline(date: Date, bundesland = 'NRW'): Date {
  const adjusted = new Date(date)
  while (!isWorkday(adjusted, bundesland)) {
    adjusted.setDate(adjusted.getDate() + 1)
  }
  return adjusted
}

// Calculate Vorfrist: X days before deadline (workdays only)
export function calculateVorfrist(deadline: Date, daysBefore: number, bundesland = 'NRW'): Date {
  const vorfrist = new Date(deadline)
  let remaining = daysBefore
  while (remaining > 0) {
    vorfrist.setDate(vorfrist.getDate() - 1)
    if (isWorkday(vorfrist, bundesland)) remaining--
  }
  return vorfrist
}

// Standard Vorfrist suggestions
export function getVorfristSuggestions(deadline: Date, bundesland = 'NRW') {
  return [
    { label: '1 Woche vorher', date: calculateVorfrist(deadline, 5, bundesland) },
    { label: '2 Wochen vorher', date: calculateVorfrist(deadline, 10, bundesland) },
    { label: '3 Tage vorher', date: calculateVorfrist(deadline, 3, bundesland) },
    { label: '1 Tag vorher', date: calculateVorfrist(deadline, 1, bundesland) },
  ]
}

// Fristverlängerung: Add weeks/months to a deadline (respecting §222)
export function extendDeadline(original: Date, weeks: number, months: number, bundesland = 'NRW'): Date {
  const extended = new Date(original)
  if (months > 0) extended.setMonth(extended.getMonth() + months)
  if (weeks > 0) extended.setDate(extended.getDate() + weeks * 7)
  return adjustDeadline(extended, bundesland)
}
