import { apiFetch } from '../client'

// Singleton store-wide configuration (backend: apps/settings_app StoreSettings,
// GET/PATCH /api/v1/settings/). This is the shared record both the web dashboard
// and the Flutter POS app should read/write — unlike per-device UI preferences
// (theme, biometric toggle, etc.), these fields describe the store itself.
export interface StoreSettings {
  store_name:          string
  address:             string
  contact_email:       string
  contact_phone:       string
  currency:            string
  currency_symbol:     string
  timezone:            string
  vat_rate:            string
  vat_inclusive:       boolean
  show_vat_receipt:    boolean
  receipt_header:      string
  receipt_footer:      string
  print_auto:          boolean
  email_receipt:       boolean
  low_stock_threshold: number
  pay_cash:            boolean
  pay_card:            boolean
  pay_gcash:           boolean
  pay_maya:            boolean
  created_at:          string
  updated_at:          string
}

export type StoreSettingsWriteData = Partial<Omit<StoreSettings, 'created_at' | 'updated_at'>>

export const getStoreSettings = (token?: string) =>
  apiFetch<StoreSettings>('/api/v1/settings/', {}, token)

/** Admin-only on the backend (403 for other roles). */
export const updateStoreSettings = (data: StoreSettingsWriteData, token?: string) =>
  apiFetch<StoreSettings>('/api/v1/settings/', { method: 'PATCH', body: JSON.stringify(data) }, token)
