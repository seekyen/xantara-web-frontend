import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface SubCategory {
  id:              number
  code:            string
  name:            string
  category_code:   string
  category_detail: { id: number; code: string; name: string }
  is_active:       boolean
  created_at:      string
  updated_at:      string
}

/** Fetch ALL sub-categories (follows pagination — use for dropdowns). */
export const getSubCategories = (token?: string, categoryCode?: string) =>
  fetchAll<SubCategory>(
    categoryCode
      ? `/api/v1/sub-categories/?category_code=${categoryCode}`
      : '/api/v1/sub-categories/',
    token,
  )

/** Fetch a single page of sub-categories (use for a paginated management table). */
export const getSubCategoriesPaged = (page = 1, token?: string, categoryCode?: string) => {
  const base = categoryCode
    ? `/api/v1/sub-categories/?category_code=${categoryCode}&page=${page}`
    : `/api/v1/sub-categories/?page=${page}`
  return apiFetch<PagedResponse<SubCategory>>(base, {}, token)
}

export const createSubCategory = (data: { name: string; category_code: string }, token?: string) =>
  apiFetch<SubCategory>('/api/v1/sub-categories/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateSubCategory = (id: number, data: { name?: string; category_code?: string; is_active?: boolean }, token?: string) =>
  apiFetch<SubCategory>(`/api/v1/sub-categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated sub-category (200). */
export const deleteSubCategory = (id: number, token?: string) =>
  apiFetch<SubCategory>(`/api/v1/sub-categories/${id}/`, { method: 'DELETE' }, token)
