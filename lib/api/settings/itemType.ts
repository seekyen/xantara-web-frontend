import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface ItemType {
  id:        number
  code:      string
  name:      string
  is_active: boolean
}

/** Fetch ALL item types (follows pagination — use for dropdowns). */
export const getItemTypes = (token?: string) =>
  fetchAll<ItemType>('/api/v1/types/', token)

/** Fetch a single page of item types (use for a paginated management table). */
export const getItemTypesPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<ItemType>>(`/api/v1/types/?page=${page}`, {}, token)

export const createItemType = (data: { name: string; is_active?: boolean }, token?: string) =>
  apiFetch<ItemType>('/api/v1/types/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateItemType = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<ItemType>(`/api/v1/types/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated item type (200). */
export const deleteItemType = (id: number, token?: string) =>
  apiFetch<ItemType>(`/api/v1/types/${id}/`, { method: 'DELETE' }, token)
