// Shared barcode format default — set once in Settings, read wherever a
// barcode preview needs to know which format to render. Persisted to
// localStorage since there's no backend/database wired up yet.

export const BARCODE_FORMATS = ['CODE128', 'EAN13', 'UPC', 'CODE39'] as const
export type BarcodeFormat = typeof BARCODE_FORMATS[number]

const STORAGE_KEY = 'xantara:barcodeFormat'
const DEFAULT_FORMAT: BarcodeFormat = 'CODE128'

export function getStoredBarcodeFormat(): BarcodeFormat {
  if (typeof window === 'undefined') return DEFAULT_FORMAT
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return (BARCODE_FORMATS as readonly string[]).includes(stored ?? '')
    ? (stored as BarcodeFormat)
    : DEFAULT_FORMAT
}

export function setStoredBarcodeFormat(format: BarcodeFormat) {
  window.localStorage.setItem(STORAGE_KEY, format)
}
