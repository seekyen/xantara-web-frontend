import { apiFetch } from './client'

export interface DashboardStats {
  today_revenue:      number
  revenue_change_pct: number
  today_txn_count:    number
  txn_change:         number
  today_avg_order:    number
  total_products:     number
  low_stock_count:    number
  out_of_stock_count: number
}

export const getDashboardStats = (token?: string) =>
  apiFetch<DashboardStats>('/api/v1/reports/dashboard/', {}, token)

export interface WeeklySalesPoint { day: string; date: string; sales: number; txns: number }

export const getWeeklySales = (token?: string) =>
  apiFetch<WeeklySalesPoint[]>('/api/v1/reports/sales/weekly/', {}, token)

export interface MonthlySalesPoint { month: string; year: number; sales: number; txns: number }

export const getMonthlySales = (token?: string) =>
  apiFetch<MonthlySalesPoint[]>('/api/v1/reports/sales/monthly/', {}, token)

export type ReportPeriod = 'all' | 'today' | 'week'

export interface TopProduct {
  product__id:        number | null
  product__descshort:  string | null
  product__itemcode:   string | null
  total_qty:           number
  total_revenue:       number
}

export function getTopProducts(
  params: { limit?: number; period?: ReportPeriod } = {},
  token?: string,
) {
  const query = new URLSearchParams()
  if (params.limit)  query.set('limit',  String(params.limit))
  if (params.period) query.set('period', params.period)
  const qs = query.toString()
  return apiFetch<TopProduct[]>(`/api/v1/reports/top-products/${qs ? `?${qs}` : ''}`, {}, token)
}

export interface PaymentBreakdownEntry {
  method:     string
  amount:     number
  percentage: number
  color:      string
}

export function getPaymentBreakdown(
  params: { period?: ReportPeriod } = {},
  token?: string,
) {
  const qs = params.period ? `?period=${params.period}` : ''
  return apiFetch<PaymentBreakdownEntry[]>(`/api/v1/reports/payment-breakdown/${qs}`, {}, token)
}

export interface CategoryRevenueEntry {
  /** The product's raw category code (Product.categorycode) — the backend has no
   *  Category foreign key to resolve this to a friendly name yet. */
  category:   string
  revenue:    number
  units:      number
  percentage: number
}

export const getCategoryRevenue = (token?: string) =>
  apiFetch<CategoryRevenueEntry[]>('/api/v1/reports/category-revenue/', {}, token)
