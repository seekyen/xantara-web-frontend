import { apiFetch, fetchAll, type PagedResponse } from './client'

export type TxnStatus = 'completed' | 'refunded' | 'voided' | 'pending'
export type PayMethod = 'cash' | 'card' | 'gcash' | 'maya'

export interface TransactionItem {
  id:         number
  product:    number | null
  name:       string
  sku:        string
  qty:        number
  price:      number
  line_total: number
}

export interface Transaction {
  id:             number
  txn_no:         string
  customer:       number | null
  customer_name:  string | null
  cashier:        number | null
  cashier_name:   string | null
  branch:         number | null
  branch_name:    string | null
  items:          TransactionItem[]
  subtotal:       number
  discount:       number
  tax:            number
  total:          number
  pay_method:     PayMethod
  pay_display:    string
  status:         TxnStatus
  status_display: string
  notes:          string
  created_at:     string
}

export interface TransactionsParams {
  status?:     TxnStatus
  pay_method?: PayMethod
  cashier?:    number
  branch?:     number
  search?:     string
  ordering?:   string
  page?:       number
}

export async function getTransactionsPage(
  params: TransactionsParams = {},
  token?: string,
): Promise<PagedResponse<Transaction>> {
  const query = new URLSearchParams()
  if (params.status)     query.set('status',     params.status)
  if (params.pay_method) query.set('pay_method', params.pay_method)
  if (params.cashier !== undefined) query.set('cashier', String(params.cashier))
  if (params.branch  !== undefined) query.set('branch',  String(params.branch))
  if (params.search)   query.set('search',   params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.page)     query.set('page',     String(params.page))

  const qs = query.toString()
  return apiFetch<PagedResponse<Transaction>>(`/api/v1/transactions/${qs ? `?${qs}` : ''}`, {}, token)
}

export const getAllTransactions = (token?: string) =>
  fetchAll<Transaction>('/api/v1/transactions/', token)

export const getTransaction = (id: number, token?: string) =>
  apiFetch<Transaction>(`/api/v1/transactions/${id}/`, {}, token)

/** Supervisor-only action (IsAdminOrManager on the backend) — only valid on a 'completed' transaction. */
export const refundTransaction = (id: number, token?: string) =>
  apiFetch<Transaction>(`/api/v1/transactions/${id}/refund/`, { method: 'POST' }, token)

/** Supervisor-only action — only valid on a 'pending' transaction. */
export const voidTransaction = (id: number, token?: string) =>
  apiFetch<Transaction>(`/api/v1/transactions/${id}/void/`, { method: 'POST' }, token)

export interface TransactionStats {
  today_revenue:   number
  today_txn_count: number
  today_avg_order: number
  today_refunds:   number
}

export const getTransactionStats = (token?: string) =>
  apiFetch<TransactionStats>('/api/v1/transactions/stats/', {}, token)
