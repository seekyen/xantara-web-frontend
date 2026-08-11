import { apiFetch, fetchAll } from '../client'

export interface SupplierBankDetail {
  id:             number
  supplier_id:    number
  bank_name:      string
  account_name:   string
  account_number: string
  is_default:     boolean
}

export type SupplierBankDetailWriteData = Omit<SupplierBankDetail, 'id'>

// Not linked by a DB foreign key on the backend — always filter/fetch by supplier_id yourself.
export const getSupplierBankDetails = (supplierId: number, token?: string) =>
  fetchAll<SupplierBankDetail>(`/api/v1/supplier-bank-details/?supplier_id=${supplierId}`, token)

export const createSupplierBankDetail = (data: SupplierBankDetailWriteData, token?: string) =>
  apiFetch<SupplierBankDetail>('/api/v1/supplier-bank-details/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateSupplierBankDetail = (id: number, data: Partial<SupplierBankDetailWriteData>, token?: string) =>
  apiFetch<SupplierBankDetail>(`/api/v1/supplier-bank-details/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Hard delete — returns 204 No Content. */
export const deleteSupplierBankDetail = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/supplier-bank-details/${id}/`, { method: 'DELETE' }, token)
