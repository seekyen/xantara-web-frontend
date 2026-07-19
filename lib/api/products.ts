import { apiFetch } from './client'
import { type Product } from '@/lib/mock/products'

export interface ProductsPage {
  count:    number
  next:     string | null
  previous: string | null
  results:  Product[]
}

export interface ProductsParams {
  deptcode?:     string
  classcode?:    string
  categorycode?: string
  active?:       boolean
  suppliercode?: string
  search?:       string
  ordering?:     string
  page?:         number
}

export async function getProductsPage(
  params: ProductsParams = {},
  token?: string,
): Promise<ProductsPage> {
  const query = new URLSearchParams()
  if (params.deptcode)     query.set('deptcode',     params.deptcode)
  if (params.classcode)    query.set('classcode',    params.classcode)
  if (params.categorycode) query.set('categorycode', params.categorycode)
  if (params.active !== undefined) query.set('active', String(params.active))
  if (params.suppliercode) query.set('suppliercode', params.suppliercode)
  if (params.search)       query.set('search',       params.search)
  if (params.ordering)     query.set('ordering',     params.ordering)
  if (params.page)         query.set('page',         String(params.page))

  const qs = query.toString()
  return apiFetch<ProductsPage>(`/api/v1/products/${qs ? `?${qs}` : ''}`, {}, token ?? undefined)
}

export type ProductWritePayload = Omit<
  Product,
  | 'id' | 'total_stock' | 'is_below_rop' | 'is_on_promo'
  | 'createdby' | 'createddate' | 'updatedby' | 'updateddate'
> & {
  /** Actual image upload — separate from the legacy `picturefile` filename reference. */
  image?: File
}

// The backend expects multipart/form-data (it accepts an image file alongside
// the rest of the product fields) — JSON can't carry binary file data.
function toFormData(data: Partial<ProductWritePayload>): FormData {
  const form = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.append(key, value instanceof File ? value : String(value))
  })
  return form
}

export async function createProduct(
  data: Partial<ProductWritePayload>,
  token?: string,
): Promise<Product> {
  return apiFetch<Product>('/api/v1/products/', {
    method: 'POST',
    body:   toFormData(data),
  }, token)
}

export async function updateProduct(
  id: number,
  data: Partial<ProductWritePayload>,
  token?: string,
): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}/`, {
    method: 'PATCH',
    body:   toFormData(data),
  }, token)
}

/** Full replace — unlike updateProduct (PATCH), this expects the complete payload. */
export async function replaceProduct(
  id: number,
  data: ProductWritePayload,
  token?: string,
): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}/`, {
    method: 'PUT',
    body:   toFormData(data),
  }, token)
}

export async function getProduct(id: number, token?: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}/`, {}, token ?? undefined)
}

export async function deleteProduct(id: number, token?: string): Promise<void> {
  return apiFetch<void>(`/api/v1/products/${id}/`, { method: 'DELETE' }, token)
}

export interface ProductStockEntry {
  branch_code:    string
  stock_sa:       number
  stock_sr:       number
  stock_book_sa:  number
  stock_book_sr:  number
  beg_balance_sa: number
  beg_balance_sr: number
  stock_reserved: number
  stock_rop:      number
  stock_limit:    number
  stock_onorder:  number
  beg_cost:       number
  updated_at:     string
}

/** Per-branch stock breakdown for a single product. */
export async function getProductStock(id: number, token?: string): Promise<ProductStockEntry[]> {
  return apiFetch<ProductStockEntry[]>(`/api/v1/products/${id}/stock/`, {}, token ?? undefined)
}

// Shape not yet confirmed against the real backend response — adjust once verified.
export interface ProductStats {
  total_products:     number
  active_products:    number
  inactive_products:  number
  low_stock_count:    number
  out_of_stock_count: number
}

export async function getProductStats(token?: string): Promise<ProductStats> {
  return apiFetch<ProductStats>('/api/v1/products/stats/', {}, token ?? undefined)
}

/** Products currently below their reorder point (ProductStock.is_below_rop). */
export async function getLowStockAlerts(token?: string): Promise<Product[]> {
  return apiFetch<Product[]>('/api/v1/products/low_stock_alerts/', {}, token ?? undefined)
}

export async function getAllProducts(token?: string): Promise<Product[]> {
  const all: Product[] = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const data = await getProductsPage({ page }, token)
    all.push(...data.results)
    hasNext = data.next !== null
    page++
  }

  return all
}
