import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface ItemForm {
  id:        number
  code:      string
  name:      string
  is_active: boolean
}

/** Fetch ALL forms (follows pagination — use for dropdowns). */
export const getForms = (token?: string) =>
  fetchAll<ItemForm>('/api/v1/forms/', token)

/** Fetch a single page of forms (use for a paginated management table). */
export const getFormsPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<ItemForm>>(`/api/v1/forms/?page=${page}`, {}, token)

export const createForm = (data: { name: string; is_active?: boolean }, token?: string) =>
  apiFetch<ItemForm>('/api/v1/forms/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateForm = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<ItemForm>(`/api/v1/forms/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated form (200). */
export const deleteForm = (id: number, token?: string) =>
  apiFetch<ItemForm>(`/api/v1/forms/${id}/`, { method: 'DELETE' }, token)
