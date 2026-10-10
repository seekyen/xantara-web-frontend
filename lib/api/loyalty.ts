import { apiFetch } from './client'

// Points are earned only inside a promo period. Each promo sets its own rate: every
// `spend_per_point` pesos of a sale, excluding VAT, earns 1 point. Decimals arrive as strings ("50.00").
export type PromoStatus = 'running' | 'upcoming' | 'ended' | 'paused'

export interface LoyaltyPromo {
  id:              number
  name:            string
  start_date:      string   // YYYY-MM-DD, inclusive
  end_date:        string   // YYYY-MM-DD, inclusive
  spend_per_point: string
  is_active:       boolean
  status:          PromoStatus
}

export type LoyaltyPromoInput = Pick<LoyaltyPromo, 'name' | 'start_date' | 'end_date' | 'is_active'> & { spend_per_point: number }

export interface LoyaltyEntry {
  id:              number
  kind:            'earn' | 'reversal'
  points:          number
  net_amount:      string
  spend_per_point: string
  promo_name:      string
  txn_no:          string | null
  created_at:      string
}

export const getLoyaltyPromos = (token?: string) =>
  apiFetch<LoyaltyPromo[]>('/api/v1/loyalty/promos/', {}, token)

export const createLoyaltyPromo = (data: LoyaltyPromoInput, token?: string) =>
  apiFetch<LoyaltyPromo>('/api/v1/loyalty/promos/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateLoyaltyPromo = (id: number, data: LoyaltyPromoInput, token?: string) =>
  apiFetch<LoyaltyPromo>(`/api/v1/loyalty/promos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }, token)

export const deleteLoyaltyPromo = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/loyalty/promos/${id}/`, { method: 'DELETE' }, token)

export const getCustomerLoyalty = (customerId: number, token?: string) =>
  apiFetch<LoyaltyEntry[]>(`/api/v1/customers/${customerId}/loyalty/`, {}, token)
