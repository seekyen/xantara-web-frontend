import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface Category {
  id:                 number
  code:               string
  name:               string
  is_active:          boolean
  sub_category_count: number
  created_at:         string
  updated_at:         string
}

/** Fetch ALL categories (follows pagination — use for dropdowns). */
export const getCategories = (token?: string) =>
  fetchAll<Category>('/api/v1/categories/', token)

/** Fetch a single page of categories (use for a paginated management table). */
export const getCategoriesPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Category>>(`/api/v1/categories/?page=${page}`, {}, token)

export const createCategory = (name: string, token?: string) =>
  apiFetch<Category>('/api/v1/categories/', { method: 'POST', body: JSON.stringify({ name }) }, token)

export const updateCategory = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Category>(`/api/v1/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated category (200). */
export const deleteCategory = (id: number, token?: string) =>
  apiFetch<Category>(`/api/v1/categories/${id}/`, { method: 'DELETE' }, token)
