import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface Unit {
  id:        number
  code:      string
  name:      string
  is_active: boolean
}

/** Fetch ALL units (follows pagination — use for dropdowns). */
export const getUnits = (token?: string) =>
  fetchAll<Unit>('/api/v1/units/', token)

/** Fetch a single page of units (use for a paginated management table). */
export const getUnitsPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Unit>>(`/api/v1/units/?page=${page}`, {}, token)

export const createUnit = (data: { name: string; is_active?: boolean }, token?: string) =>
  apiFetch<Unit>('/api/v1/units/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateUnit = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Unit>(`/api/v1/units/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated unit (200). */
export const deleteUnit = (id: number, token?: string) =>
  apiFetch<Unit>(`/api/v1/units/${id}/`, { method: 'DELETE' }, token)
