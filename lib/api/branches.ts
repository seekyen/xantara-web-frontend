import { apiFetch, fetchAll } from './client'

export interface Branch {
  id:          number
  name:        string
  address:     string
  phone:       string
  email:       string
  is_active:   boolean
  staff_count: number
  created_at:  string
}

export type BranchWriteData = { name: string } & Partial<Pick<Branch, 'address' | 'phone' | 'email' | 'is_active'>>

export const getAllBranches = (token?: string) =>
  fetchAll<Branch>('/api/v1/branches/', token)

export const getBranch = (id: number, token?: string) =>
  apiFetch<Branch>(`/api/v1/branches/${id}/`, {}, token)

export const createBranch = (data: BranchWriteData, token?: string) =>
  apiFetch<Branch>('/api/v1/branches/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateBranch = (id: number, data: Partial<BranchWriteData>, token?: string) =>
  apiFetch<Branch>(`/api/v1/branches/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

export const deleteBranch = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/branches/${id}/`, { method: 'DELETE' }, token)
