'use client'

import { useEffect, useState } from 'react'
import {
  Search, Download, Eye, RefreshCw, Loader2,
  CreditCard, Banknote, Smartphone, Receipt, Store,
} from 'lucide-react'
import { type Transaction, type PayMethod, type TxnStatus, refundTransaction } from '@/lib/api/sales'
import { getAllBranches, type Branch } from '@/lib/api/branches'
import { usePOS }       from '@/context/POSContext'
import Badge             from '@/components/shared/Badge'
import EmptyState        from '@/components/shared/EmptyState'
import DrawerModal       from '@/components/shared/DrawerModal'
import Pagination        from '@/components/shared/Pagination'

const PAGE_SIZE = 10

const PAY_ICON: Record<PayMethod, React.ReactNode> = {
  card:  <CreditCard  className="w-3.5 h-3.5" />,
  cash:  <Banknote    className="w-3.5 h-3.5" />,
  gcash: <Smartphone  className="w-3.5 h-3.5" />,
  maya:  <Smartphone  className="w-3.5 h-3.5" />,
}

const STATUS_VARIANT: Record<TxnStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  completed: 'success',
  refunded:  'warning',
  voided:    'danger',
  pending:   'info',
}

const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined

function fmt(n: number) { return `₱${Number(n).toLocaleString('en-PH')}` }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}
function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}

export default function SalesPage() {
  const { transactions, setTransactions, transactionsLoading } = usePOS()

  const [search,      setSearch]      = useState('')
  const [statusFlt,   setStatusFlt]   = useState<'All' | TxnStatus>('All')
  const [payFlt,      setPayFlt]      = useState<'All' | PayMethod>('All')
  const [dateFlt,     setDateFlt]     = useState('Today')
  const [page,        setPage]        = useState(1)
  const [detail,      setDetail]      = useState<Transaction | null>(null)
  const [refunding,   setRefunding]   = useState(false)
  const [refundError, setRefundError] = useState('')
  const [branches,    setBranches]    = useState<Branch[]>([])

  // Branch list so branches with no sales in the period still appear (as ₱0).
  useEffect(() => { getAllBranches(authToken()).then(setBranches).catch(() => {}) }, [])

  const today     = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7)

  // The date pills drive both the table and the branch performance panel.
  const inRange = (iso: string) => {
    if (dateFlt === 'Today')       return isSameDay(iso, today)
    if (dateFlt === 'Yesterday')   return isSameDay(iso, yesterday)
    if (dateFlt === 'Last 7 days') return new Date(iso) >= weekAgo
    if (dateFlt === 'This Month') {
      const d = new Date(iso)
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    }
    return true
  }

  // ── Filter ──
  const filtered = transactions
    .filter((t) =>
      search
        ? t.txn_no.toLowerCase().includes(search.toLowerCase()) ||
          (t.cashier_name ?? '').toLowerCase().includes(search.toLowerCase())
        : true
    )
    .filter((t) => statusFlt !== 'All' ? t.status     === statusFlt : true)
    .filter((t) => payFlt    !== 'All' ? t.pay_method === payFlt    : true)
    .filter((t) => inRange(t.created_at))
    .sort((a, b) => b.txn_no.localeCompare(a.txn_no))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Stats ──
  const completed    = transactions.filter((t) => t.status === 'completed')
  const todayComp    = completed.filter((t) => isSameDay(t.created_at, today))
  const todayRev     = todayComp.reduce((s, t) => s + Number(t.total), 0)
  const avgOrder     = todayComp.length ? Math.round(todayRev / todayComp.length) : 0
  const refunded     = transactions.filter((t) => t.status === 'refunded')
  const refundCount  = refunded.length
  const refundTotal  = refunded.reduce((s, t) => s + Number(t.total), 0)

  // ── Branch performance (completed sales; refunds shown separately) ──
  type BranchRow = { key: string; name: string; revenue: number; sales: number; refunds: number; refundTotal: number }
  const branchRows = new Map<string, BranchRow>()
  const branchRow = (id: number | null, name: string | null) => {
    const key = id === null ? 'unassigned' : String(id)
    let row = branchRows.get(key)
    if (!row) { row = { key, name: name ?? 'Unassigned', revenue: 0, sales: 0, refunds: 0, refundTotal: 0 }; branchRows.set(key, row) }
    return row
  }
  branches.filter((b) => b.is_active).forEach((b) => branchRow(b.id, b.name))
  transactions.filter((t) => inRange(t.created_at)).forEach((t) => {
    if (t.status === 'completed') { const r = branchRow(t.branch, t.branch_name); r.revenue += Number(t.total); r.sales += 1 }
    else if (t.status === 'refunded') { const r = branchRow(t.branch, t.branch_name); r.refunds += 1; r.refundTotal += Number(t.total) }
  })
  const branchPerformance = [...branchRows.values()].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name))
  const branchRevenue = branchPerformance.reduce((sum, r) => sum + r.revenue, 0)

  const issueRefund = async (id: number) => {
    setRefunding(true)
    setRefundError('')
    try {
      const updated = await refundTransaction(id, authToken())
      setTransactions((prev) => prev.map((t) => t.id === id ? updated : t))
      if (detail?.id === id) setDetail(updated)
    } catch {
      setRefundError('Could not issue refund. Please check your connection and try again.')
    } finally {
      setRefunding(false)
    }
  }

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Sales & Transactions</h1>
          <p className="text-sm text-neutral-400 mt-0.5">View and manage all transactions</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold
          text-neutral-600 bg-white border border-neutral-200 rounded-xl
          hover:bg-neutral-50 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: 'Total Revenue',    value: fmt(todayRev),            sub: 'today',            color: 'text-neutral-400', bg: 'bg-brand-50',   icon: <Receipt className="w-4 h-4 text-brand-600" /> },
          { label: 'Transactions',     value: String(todayComp.length), sub: 'completed today',  color: 'text-neutral-400', bg: 'bg-success-50', icon: <Receipt className="w-4 h-4 text-success-600" /> },
          { label: 'Avg. Order Value', value: fmt(avgOrder),            sub: 'per transaction',  color: 'text-neutral-400', bg: 'bg-warning-50', icon: <Receipt className="w-4 h-4 text-warning-600" /> },
          { label: 'Refunds',          value: String(refundCount),      sub: `${fmt(refundTotal)} refunded`, color: 'text-danger-600', bg: 'bg-danger-50', icon: <RefreshCw className="w-4 h-4 text-danger-600" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>{s.icon}</div>
            </div>
            <div className="text-2xl font-bold text-neutral-800">{s.value}</div>
            <div className={`text-xs mt-1 ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search TXN# or cashier…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-neutral-400"
          />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All','completed','refunded','voided','pending'] as const).map((s) => (
            <button key={s} onClick={() => { setStatusFlt(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors
                ${statusFlt === s ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Pay method */}
        <select value={payFlt} onChange={(e) => { setPayFlt(e.target.value as 'All' | PayMethod); setPage(1) }}
          className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
            text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600 capitalize">
          <option value="All">All Methods</option>
          {(['cash','card','gcash','maya'] as const).map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
        </select>

        {/* Date range */}
        <div className="ml-auto flex items-center gap-1.5">
          {['Today','Yesterday','Last 7 days','This Month'].map((d) => (
            <button key={d} onClick={() => { setDateFlt(d); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                ${dateFlt === d ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Branch performance ── */}
      <div className="mx-6 mb-4 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-neutral-800">Branch performance</h2>
          </div>
          <span className="text-xs text-neutral-400">{dateFlt} · completed sales</span>
        </div>
        {branchPerformance.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-400">{transactionsLoading ? 'Loading…' : 'No branches yet.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['Branch', 'Revenue', 'Transactions', 'Avg. order', 'Refunds'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {branchPerformance.map((r, index) => {
                  const share = branchRevenue ? Math.round((r.revenue / branchRevenue) * 100) : 0
                  return (
                    <tr key={r.key}>
                      <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                        <span className="flex items-center gap-2">
                          {r.name}
                          {index === 0 && r.revenue > 0 && branchPerformance.length > 1 && <Badge variant="success">Top</Badge>}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-bold text-neutral-800">{fmt(r.revenue)}</span>
                          <span className="text-xs text-neutral-400">{share}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100 overflow-hidden" role="presentation">
                          <div className="h-full rounded-full bg-brand-600" style={{ width: `${share}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{r.sales}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{fmt(r.sales ? Math.round(r.revenue / r.sales) : 0)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={r.refunds ? 'text-danger-600 font-semibold' : 'text-neutral-400'}>
                          {r.refunds}{r.refunds > 0 && ` · ${fmt(r.refundTotal)}`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {['TXN No','Date & Time','Cashier','Items','Payment','Total','Status',''].map((h) => (
                <th key={h}
                  className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                    ${h === 'Total' ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((t) => (
              <tr key={t.id}
                className="hover:bg-neutral-50 transition-colors cursor-pointer"
                onClick={() => setDetail(t)}>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-brand-600 font-mono">{t.txn_no}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-neutral-800">{formatDate(t.created_at)}</div>
                  <div className="text-[10px] text-neutral-400">{formatTime(t.created_at)}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-700">{t.cashier_name ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-neutral-600">
                    {t.items.length} {t.items.length === 1 ? 'item' : 'items'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    {PAY_ICON[t.pay_method]}
                    {t.pay_display}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-neutral-800">{fmt(t.total)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status_display}</Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setDetail(t)}
                    className="w-7 h-7 rounded-md flex items-center justify-center
                      hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactionsLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading transactions…</span>
          </div>
        )}

        {!transactionsLoading && paginated.length === 0 && (
          <EmptyState
            icon={<Receipt className="w-6 h-6 text-brand-600" />}
            title="No transactions found"
            description="Try adjusting your search or filters"
          />
        )}

        {filtered.length > 0 && (
          <Pagination
            page={page} totalPages={totalPages}
            totalItems={filtered.length} pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Transaction detail drawer ── */}
      <DrawerModal
        isOpen={!!detail}
        onClose={() => { setDetail(null); setRefundError('') }}
        title={detail?.txn_no ?? ''}
        footer={
          <div className="px-6 py-4 flex flex-col gap-2">
            {refundError && <p className="text-xs text-danger-600">{refundError}</p>}
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                Print Receipt
              </button>
              {detail?.status === 'completed' && (
                <button
                  onClick={() => detail && issueRefund(detail.id)}
                  disabled={refunding}
                  className="flex-1 py-2.5 text-sm font-semibold text-white
                    bg-warning-600 rounded-lg hover:bg-warning-600/90 transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {refunding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Issue Refund
                </button>
              )}
            </div>
          </div>
        }
      >
        {detail && (
          <div className="px-6 py-5 space-y-5">
            {/* Header info */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Date</span>
                <span className="text-xs font-semibold text-neutral-800">
                  {formatDate(detail.created_at)} · {formatTime(detail.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Cashier</span>
                <span className="text-xs font-semibold text-neutral-800">{detail.cashier_name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Status</span>
                <Badge variant={STATUS_VARIANT[detail.status]}>{detail.status_display}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Payment</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                  {PAY_ICON[detail.pay_method]} {detail.pay_display}
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Items
              </div>
              <div className="space-y-2.5">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-800">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{item.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-neutral-800">
                        {fmt(item.line_total)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {item.qty} × {fmt(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
              {[
                { label: 'Subtotal',  value: fmt(detail.subtotal) },
                { label: 'Discount',  value: detail.discount ? `-${fmt(detail.discount)}` : '—' },
                { label: 'VAT (12%)', value: fmt(detail.tax) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{label}</span>
                  <span className="text-xs font-medium text-neutral-800">{value}</span>
                </div>
              ))}
              <div className="border-t border-neutral-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-800">Total</span>
                <span className="text-sm font-bold text-neutral-800">{fmt(detail.total)}</span>
              </div>
            </div>
          </div>
        )}
      </DrawerModal>

    </div>
  )
}
