import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface ItemClass {
  id:        number
  code:      string
  name:      string
  is_active: boolean
}

/** Fetch ALL classes (follows pagination — use for dropdowns). */
export const getClasses = (token?: string) =>
  fetchAll<ItemClass>('/api/v1/classes/', token)

/** Fetch a single page of classes (use for a paginated management table). */
export const getClassesPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<ItemClass>>(`/api/v1/classes/?page=${page}`, {}, token)

export const createClass = (data: { name: string; is_active?: boolean }, token?: string) =>
  apiFetch<ItemClass>('/api/v1/classes/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateClass = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<ItemClass>(`/api/v1/classes/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated class (200). */
export const deleteClass = (id: number, token?: string) =>
  apiFetch<ItemClass>(`/api/v1/classes/${id}/`, { method: 'DELETE' }, token)
