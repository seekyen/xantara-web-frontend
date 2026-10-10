import { apiFetch, fetchAll, type PagedResponse } from './client'
import { type Transaction } from './sales'

export type CustomerStatus = 'active' | 'inactive'

export interface Customer {
  id:             number
  name:           string
  email:          string | null
  phone:          string
  status:         CustomerStatus
  status_display: string
  total_spent:    number
  total_orders:   number
  loyalty_points: number
  last_visit:     string | null
  joined_at:      string
  initials:       string
}

export type CustomerWriteData = {
  name: string
} & Partial<Pick<Customer, 'email' | 'phone' | 'status'>>

export interface CustomersParams {
  status?:   CustomerStatus
  search?:   string
  ordering?: string
  page?:     number
}

export async function getCustomersPage(
  params: CustomersParams = {},
  token?: string,
): Promise<PagedResponse<Customer>> {
  const query = new URLSearchParams()
  if (params.status)   query.set('status',   params.status)
  if (params.search)   query.set('search',   params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.page)     query.set('page',     String(params.page))

  const qs = query.toString()
  return apiFetch<PagedResponse<Customer>>(`/api/v1/customers/${qs ? `?${qs}` : ''}`, {}, token)
}

export const getAllCustomers = (token?: string) =>
  fetchAll<Customer>('/api/v1/customers/', token)

export const getCustomer = (id: number, token?: string) =>
  apiFetch<Customer>(`/api/v1/customers/${id}/`, {}, token)

export const createCustomer = (data: CustomerWriteData, token?: string) =>
  apiFetch<Customer>('/api/v1/customers/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateCustomer = (id: number, data: Partial<CustomerWriteData>, token?: string) =>
  apiFetch<Customer>(`/api/v1/customers/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

export const deleteCustomer = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/customers/${id}/`, { method: 'DELETE' }, token)

/** Last 20 transactions for this customer, most recent first. */
export const getCustomerTransactions = (id: number, token?: string) =>
  apiFetch<Transaction[]>(`/api/v1/customers/${id}/transactions/`, {}, token)

export interface CustomerStats {
  total:              number
  active:             number
  inactive:           number
  new_this_month:     number
  avg_lifetime_value: number
}

export const getCustomerStats = (token?: string) =>
  apiFetch<CustomerStats>('/api/v1/customers/stats/', {}, token)
