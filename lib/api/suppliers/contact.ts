import { apiFetch, fetchAll } from '../client'

export interface SupplierContact {
  id:           number
  supplier_id:  number
  contact_name: string
  position:     string | null
  phone:        string | null
  email:        string | null
  is_primary:   boolean
}

export type SupplierContactWriteData = Omit<SupplierContact, 'id'>

// Not linked by a DB foreign key on the backend — always filter/fetch by supplier_id yourself.
export const getSupplierContacts = (supplierId: number, token?: string) =>
  fetchAll<SupplierContact>(`/api/v1/supplier-contacts/?supplier_id=${supplierId}`, token)

export const createSupplierContact = (data: SupplierContactWriteData, token?: string) =>
  apiFetch<SupplierContact>('/api/v1/supplier-contacts/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateSupplierContact = (id: number, data: Partial<SupplierContactWriteData>, token?: string) =>
  apiFetch<SupplierContact>(`/api/v1/supplier-contacts/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Hard delete — returns 204 No Content. */
export const deleteSupplierContact = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/supplier-contacts/${id}/`, { method: 'DELETE' }, token)
