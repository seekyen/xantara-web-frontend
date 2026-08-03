import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface Color {
  id:        number
  code:      string
  name:      string
  is_active: boolean
}

/** Fetch ALL colors (follows pagination — use for dropdowns). */
export const getColors = (token?: string) =>
  fetchAll<Color>('/api/v1/colors/', token)

/** Fetch a single page of colors (use for a paginated management table). */
export const getColorsPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Color>>(`/api/v1/colors/?page=${page}`, {}, token)

export const createColor = (data: { name: string; is_active?: boolean }, token?: string) =>
  apiFetch<Color>('/api/v1/colors/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateColor = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Color>(`/api/v1/colors/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated color (200). */
export const deleteColor = (id: number, token?: string) =>
  apiFetch<Color>(`/api/v1/colors/${id}/`, { method: 'DELETE' }, token)
