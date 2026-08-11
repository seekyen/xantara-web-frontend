import { apiFetch, fetchAll } from '../client'

export type AddressType = 'billing' | 'shipping'

export interface SupplierAddress {
  id:            number
  supplier_id:   number
  address_type:  AddressType
  unit_bldg_no:  string | null
  street:        string | null
  subdivision:   string | null
  barangay:      string
  city:          string
  province:      string | null
  region:        string | null
  postal_code:   string | null
  country:       string
  is_default:    boolean
}

export type SupplierAddressWriteData = Omit<SupplierAddress, 'id'>

// Not linked by a DB foreign key on the backend — always filter/fetch by supplier_id yourself.
export const getSupplierAddresses = (supplierId: number, token?: string) =>
  fetchAll<SupplierAddress>(`/api/v1/supplier-addresses/?supplier_id=${supplierId}`, token)

export const createSupplierAddress = (data: SupplierAddressWriteData, token?: string) =>
  apiFetch<SupplierAddress>('/api/v1/supplier-addresses/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateSupplierAddress = (id: number, data: Partial<SupplierAddressWriteData>, token?: string) =>
  apiFetch<SupplierAddress>(`/api/v1/supplier-addresses/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Hard delete — returns 204 No Content (unlike Supplier's soft-delete). */
export const deleteSupplierAddress = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/supplier-addresses/${id}/`, { method: 'DELETE' }, token)
