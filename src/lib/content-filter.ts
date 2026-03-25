/**
 * Content filter: replaces private contact info (phone, email, addresses, 
 * firm names / "Kanzlei") in lawyer profile text fields with "J. L."
 */

const patterns = [
  // Email
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone (various German formats)
  /(\+?\d{1,4}[\s-]?)?(\(?\d{2,5}\)?[\s-]?)?\d{3,10}[\s-]?\d{2,10}/g,
  // URLs
  /https?:\/\/[^\s]+/g,
  // "Kanzlei ..." pattern
  /Kanzlei\s+[A-ZÄÖÜ][a-zäöüß]+(\s+(&|und)\s+[A-ZÄÖÜ][a-zäöüß]+)*/gi,
  // Postal addresses (German: PLZ Stadt pattern)
  /\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/g,
  // Street addresses
  /[A-ZÄÖÜ][a-zäöüß]+(straße|str\.|weg|gasse|platz|allee|ring)\s*\d+[a-z]?/gi,
]

export function filterContactInfo(text: string): string {
  if (!text) return text
  let filtered = text
  for (const pattern of patterns) {
    filtered = filtered.replace(pattern, 'J. L.')
  }
  // Collapse multiple consecutive "J. L." 
  filtered = filtered.replace(/(J\. L\.(\s*,?\s*)?){2,}/g, 'J. L.')
  return filtered
}
