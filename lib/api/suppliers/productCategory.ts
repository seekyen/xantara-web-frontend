import { apiFetch, fetchAll } from '../client'

export interface SupplierProductCategory {
  id:            number
  supplier_id:   number
  /** Free text — not linked to the inventory Category/SubCategory lookup tables. */
  category_name: string
}

export type SupplierProductCategoryWriteData = Omit<SupplierProductCategory, 'id'>

// Not linked by a DB foreign key on the backend — always filter/fetch by supplier_id yourself.
export const getSupplierProductCategories = (supplierId: number, token?: string) =>
  fetchAll<SupplierProductCategory>(`/api/v1/supplier-product-categories/?supplier_id=${supplierId}`, token)

export const createSupplierProductCategory = (data: SupplierProductCategoryWriteData, token?: string) =>
  apiFetch<SupplierProductCategory>('/api/v1/supplier-product-categories/', { method: 'POST', body: JSON.stringify(data) }, token)

export const updateSupplierProductCategory = (id: number, data: Partial<SupplierProductCategoryWriteData>, token?: string) =>
  apiFetch<SupplierProductCategory>(`/api/v1/supplier-product-categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, token)

/** Hard delete — returns 204 No Content. */
export const deleteSupplierProductCategory = (id: number, token?: string) =>
  apiFetch<void>(`/api/v1/supplier-product-categories/${id}/`, { method: 'DELETE' }, token)
