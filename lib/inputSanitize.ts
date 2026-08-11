// Shared input filters for Supplier and Inventory (Product) forms — one function per
// allowed character set, so every "number" field and free-text field enforces the same
// rule instead of a one-off regex per field.

/** Keeps only digits and a single decimal dot — for fields that must be a plain number
 *  (quantities, days, rates). No commas, no letters, no other symbols. */
export function sanitizeNumericText(value: string): string {
  let cleaned = value.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return cleaned
}

/** Strips characters outside the allowed set for free-text fields: letters (incl.
 *  accented, e.g. "ñ"), digits, spaces, and , . ' & ( ) - — covers real business/address
 *  names like "O'Brien", "R&D Corp.", "Sta. Rosa" while still blocking stray symbols. */
export function sanitizeTextInput(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s,.'&()-]/gu, '')
}
