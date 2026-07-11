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
  | 'stock_book_sa' | 'stock_book_sr' | 'beg_balance_sa' | 'beg_balance_sr' | 'beg_cost'
>

export async function createProduct(
  data: Partial<ProductWritePayload>,
  token?: string,
): Promise<Product> {
  return apiFetch<Product>('/api/v1/products/', {
    method: 'POST',
    body:   JSON.stringify(data),
  }, token)
}

export async function updateProduct(
  id: number,
  data: Partial<ProductWritePayload>,
  token?: string,
): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}/`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  }, token)
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
