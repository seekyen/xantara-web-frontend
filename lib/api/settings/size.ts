import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface Size {
  id:        number
  code:      string
  name:      string
  is_active: boolean
}

/** Fetch ALL sizes (follows pagination — use for dropdowns). */
export const getSizes = (token?: string) =>
  fetchAll<Size>('/api/v1/sizes/', token)

/** Fetch a single page of sizes (use for a paginated management table). */
export const getSizesPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Size>>(`/api/v1/sizes/?page=${page}`, {}, token)

export const createSize = (data: { name: string; is_active?: boolean }, token?: string) =>
  apiFetch<Size>('/api/v1/sizes/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateSize = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Size>(`/api/v1/sizes/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated size (200). */
export const deleteSize = (id: number, token?: string) =>
  apiFetch<Size>(`/api/v1/sizes/${id}/`, { method: 'DELETE' }, token)
