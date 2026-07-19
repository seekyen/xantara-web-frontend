// Shared QR styling defaults — set once in Settings, read wherever a QR
// preview needs to know how to render. Persisted to localStorage since
// there's no backend/database wired up yet (see lib/barcodeFormat.ts for the
// equivalent barcode-format convention).

import type { DotType, ErrorCorrectionLevel } from 'qr-code-styling'

export const QR_DOT_TYPES: DotType[] = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded']
export const QR_ERROR_CORRECTION_LEVELS: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']

// Compact "X" mark — a better fit for a QR center logo than the full wordmark.
export const QR_LOGO_URL = '/images/x-logo.png'

export interface QRStyleOptions {
  dotType:               DotType
  dotsColor:             string
  backgroundColor:       string
  errorCorrectionLevel:  ErrorCorrectionLevel
  includeLogo:           boolean
}

const STORAGE_KEY = 'xantara:qrStyle'

export const DEFAULT_QR_STYLE: QRStyleOptions = {
  dotType:              'square',
  dotsColor:            '#000000',
  backgroundColor:      '#ffffff',
  errorCorrectionLevel: 'H', // 'H' leaves the most room for a logo overlay
  includeLogo:          false,
}

export function getStoredQRStyle(): QRStyleOptions {
  if (typeof window === 'undefined') return DEFAULT_QR_STYLE
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_QR_STYLE
    return { ...DEFAULT_QR_STYLE, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_QR_STYLE
  }
}

export function setStoredQRStyle(style: QRStyleOptions) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(style))
}
