import { apiFetch, fetchAll, type PagedResponse } from './client'
import { type Branch } from './branches'

export type StaffRole   = 'admin' | 'manager' | 'cashier' | 'stock_clerk'
export type StaffStatus = 'active' | 'inactive' | 'on_leave'

export const STAFF_ROLES: { value: StaffRole; label: string; hint: string }[] = [
  { value: 'admin',       label: 'Admin',       hint: 'Full access — can add/remove staff, edit settings, view all reports.' },
  { value: 'manager',     label: 'Manager',     hint: 'Can edit staff and inventory, void/refund transactions, view reports for their branch.' },
  { value: 'cashier',     label: 'Cashier',     hint: 'Can run the POS and process sales. Cannot edit staff, settings, or inventory.' },
  { value: 'stock_clerk', label: 'Stock Clerk', hint: 'Can manage inventory and stock counts. No POS or staff access.' },
]

export const STAFF_STATUSES: { value: StaffStatus; label: string }[] = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
]

export interface Staff {
  id:                 number
  name:               string
  email:              string
  phone:              string
  role:               StaffRole
  role_display:       string
  branch:             number | null
  branch_detail:      Branch | null
  status:             StaffStatus
  status_display:     string
  avatar:             string
  initials:           string
  sales_count:        number
  last_login_at:      string | null
  joined_at:          string | null
  created_at:         string
  has_pin:            boolean
  biometric_enabled:  boolean
}

export interface StaffCreateData {
  name:     string
  email:    string
  password: string
  phone?:   string
  role?:    StaffRole
  branch?:  number | null
  status?:  StaffStatus
}

export type StaffUpdateData = Partial<Omit<StaffCreateData, 'password'>>

export interface StaffParams {
  role?:     StaffRole
  status?:   StaffStatus
  branch?:   number
  search?:   string
  ordering?: string
  page?:     number
}

export async function getStaffPage(params: StaffParams = {}, token?: string): Promise<PagedResponse<Staff>> {
  const query = new URLSearchParams()
  if (params.role)     query.set('role',     params.role)
  if (params.status)   query.set('status',   params.status)
  if (params.branch !== undefined) query.set('branch', String(params.branch))
  if (params.search)   query.set('search',   params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.page)     query.set('page',     String(params.page))

  const qs = query.toString()
  return apiFetch<PagedResponse<Staff>>(`/api/v1/staff/${qs ? `?${qs}` : ''}`, {}, token)
}

export const getAllStaff = (token?: string) =>
  fetchAll<Staff>('/api/v1/staff/', token)

export const getStaffMember = (id: number, token?: string) =>
  apiFetch<Staff>(`/api/v1/staff/${id}/`, {}, token)

/** Admin-only on the backend (403 for other roles). */
export const createStaff = (data: StaffCreateData, token?: string) =>
  apiFetch<Staff>('/api/v1/staff/', { method: 'POST', body: JSON.stringify(data) }, token)

/** Admin or manager on the backend. */
export const updateStaff = (id: number, data: StaffUpdateData, token?: string) =>
  apiFetch<Staff>(`/api/v1/staff/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Admin-only on the backend. */
export const deleteStaff = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/staff/${id}/`, { method: 'DELETE' }, token)

/** Admin or manager on the backend. */
export const toggleStaffStatus = (id: number, status: StaffStatus, token?: string) =>
  apiFetch<{ status: StaffStatus }>(`/api/v1/staff/${id}/toggle_status/`, {
    method: 'POST', body: JSON.stringify({ status }),
  }, token)

/** Admin-only password reset for a selected staff account. */
export const resetStaffPassword = (
  id: number,
  data: { new_password: string; confirm_password: string },
  token?: string,
) => apiFetch<{ message: string }>(`/api/v1/staff/${id}/reset_password/`, {
  method: 'POST', body: JSON.stringify(data),
}, token)
