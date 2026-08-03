import { apiFetch, fetchAll, type PagedResponse } from '../client'

export interface Department {
  id:         number
  code:       string
  name:       string
  class_name: string
  is_active:  boolean
}

/** Fetch ALL departments (follows pagination — use for dropdowns). */
export const getDepartments = (token?: string) =>
  fetchAll<Department>('/api/v1/departments/', token)

/** Fetch a single page of departments (use for a paginated management table). */
export const getDepartmentsPaged = (page = 1, token?: string) =>
  apiFetch<PagedResponse<Department>>(`/api/v1/departments/?page=${page}`, {}, token)

export const createDepartment = (data: { name: string; class_name: string }, token?: string) =>
  apiFetch<Department>('/api/v1/departments/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateDepartment = (id: number, data: { name?: string; class_name?: string; is_active?: boolean }, token?: string) =>
  apiFetch<Department>(`/api/v1/departments/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Soft-delete: toggles is_active. Returns the updated department (200). */
export const deleteDepartment = (id: number, token?: string) =>
  apiFetch<Department>(`/api/v1/departments/${id}/`, { method: 'DELETE' }, token)
