import { apiFetch } from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  id:                 number
  code:               string
  name:               string
  is_active:          boolean
  sub_category_count: number
  created_at:         string
  updated_at:         string
}

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

export interface Department {
  id:         number
  code:       string
  name:       string
  class_name: string
  is_active:  boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export type PagedResponse<T> = {
  count:    number
  next:     string | null
  previous: string | null
  results:  T[]
}

async function fetchAll<T>(path: string, token?: string): Promise<T[]> {
  const results: T[] = []
  let nextPath: string | null = path

  while (nextPath) {
    const data: T[] | PagedResponse<T> = await apiFetch<T[] | PagedResponse<T>>(nextPath, {}, token)
    if (Array.isArray(data)) {
      results.push(...data)
      break
    }
    results.push(...data.results)
    if (data.next) {
      const u: URL = new URL(data.next)
      nextPath = u.pathname + u.search
    } else {
      nextPath = null
    }
  }

  return results
}

// ── Categories ────────────────────────────────────────────────────────────────

/** Fetch ALL categories (follows pagination — use for dropdowns). */
export const getCategories = (token?: string) =>
  fetchAll<Category>('/api/v1/categories/', token)

/** Fetch a single page of categories (use for paginated tables). */
export const getCategoriesPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Category>>(`/api/v1/categories/?page=${page}`, {}, token)

export const createCategory = (name: string, token?: string) =>
  apiFetch<Category>('/api/v1/categories/', { method: 'POST', body: JSON.stringify({ name }) }, token)

export const updateCategory = (id: number, data: { name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Category>(`/api/v1/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns updated Category object (200). */
export const deleteCategory = (id: number, token?: string) =>
  apiFetch<Category>(`/api/v1/categories/${id}/`, { method: 'DELETE' }, token)

// ── Sub-Categories ────────────────────────────────────────────────────────────

/** Fetch ALL sub-categories (follows pagination — use for dropdowns). */
export const getSubCategories = (token?: string, categoryCode?: string) =>
  fetchAll<SubCategory>(
    categoryCode
      ? `/api/v1/sub-categories/?category_code=${categoryCode}`
      : '/api/v1/sub-categories/',
    token,
  )

/** Fetch a single page of sub-categories (use for paginated tables). */
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

/** Soft-delete: toggles is_active. Returns updated SubCategory object (200). */
export const deleteSubCategory = (id: number, token?: string) =>
  apiFetch<SubCategory>(`/api/v1/sub-categories/${id}/`, { method: 'DELETE' }, token)

// ── Departments ───────────────────────────────────────────────────────────────

/** Fetch ALL departments (follows pagination — use for dropdowns). */
export const getDepartments = (token?: string) =>
  fetchAll<Department>('/api/v1/departments/', token)

/** Fetch a single page of departments (use for paginated tables). */
export const getDepartmentsPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Department>>(`/api/v1/departments/?page=${page}`, {}, token)

export const createDepartment = (data: { name: string; class_name: string }, token?: string) =>
  apiFetch<Department>('/api/v1/departments/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateDepartment = (id: number, data: { name?: string; class_name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Department>(`/api/v1/departments/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns updated Department object (200). */
export const deleteDepartment = (id: number, token?: string) =>
  apiFetch<Department>(`/api/v1/departments/${id}/`, { method: 'DELETE' }, token)
