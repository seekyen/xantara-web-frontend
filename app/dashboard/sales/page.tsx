'use client'

// TODO: Replace MOCK_DATA with API call → GET /api/transactions

import { useState, useEffect } from 'react'
import {
  Search, Download, Eye, RefreshCw,
  CreditCard, Banknote, Smartphone, Receipt,
} from 'lucide-react'
import { type Transaction, type PayMethod } from '@/lib/mock/transactions'
import { usePOS }       from '@/context/POSContext'
import Badge            from '@/components/shared/Badge'
import EmptyState       from '@/components/shared/EmptyState'
import DrawerModal      from '@/components/shared/DrawerModal'
import Pagination       from '@/components/shared/Pagination'

const PAGE_SIZE = 10

const PAY_ICON: Record<PayMethod, React.ReactNode> = {
  Card:  <CreditCard  className="w-3.5 h-3.5" />,
  Cash:  <Banknote    className="w-3.5 h-3.5" />,
  GCash: <Smartphone  className="w-3.5 h-3.5" />,
  Maya:  <Smartphone  className="w-3.5 h-3.5" />,
}

function fmt(n: number) { return `₱${n.toLocaleString()}` }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SalesPage() {
  const { transactions, setTransactions } = usePOS()

  const [search,      setSearch]      = useState('')
  const [statusFlt,   setStatusFlt]   = useState('All')
  const [payFlt,      setPayFlt]      = useState('All')
  const [dateFlt,     setDateFlt]     = useState('Today')
  const [page,        setPage]        = useState(1)
  const [detail,      setDetail]      = useState<Transaction | null>(null)

  // ── Filter ──
  const filtered = transactions
    .filter((t) =>
      search
        ? t.txnNo.toLowerCase().includes(search.toLowerCase()) ||
          t.cashier.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .filter((t) => statusFlt !== 'All' ? t.status === statusFlt : true)
    .filter((t) => payFlt    !== 'All' ? t.payMethod === payFlt  : true)
    .filter((t) => {
      if (dateFlt === 'Today')      return t.date === '2026-05-24'
      if (dateFlt === 'Yesterday')  return t.date === '2026-05-23'
      if (dateFlt === 'Last 7 days') return t.date >= '2026-05-18'
      return true
    })
    .sort((a, b) => b.txnNo.localeCompare(a.txnNo))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [search, statusFlt, payFlt, dateFlt])

  // ── Stats ──
  const completed    = transactions.filter((t) => t.status === 'Completed')
  const todayComp    = completed.filter((t) => t.date === '2026-05-24')
  const todayRev     = todayComp.reduce((s, t) => s + t.total, 0)
  const avgOrder     = todayComp.length ? Math.round(todayRev / todayComp.length) : 0
  const refundCount  = transactions.filter((t) => t.status === 'Refunded').length
  const refundTotal  = transactions.filter((t) => t.status === 'Refunded').reduce((s, t) => s + t.total, 0)

  const issueRefund = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: 'Refunded' as const } : t)
    )
    if (detail?.id === id) setDetail((d) => d ? { ...d, status: 'Refunded' } : d)
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
          { label: 'Total Revenue',    value: fmt(todayRev),      sub: '+12% vs yesterday', color: 'text-success-600', bg: 'bg-brand-50',   icon: <Receipt className="w-4 h-4 text-brand-600" /> },
          { label: 'Transactions',     value: String(todayComp.length), sub: 'completed today',  color: 'text-neutral-400', bg: 'bg-success-50', icon: <Receipt className="w-4 h-4 text-success-600" /> },
          { label: 'Avg. Order Value', value: fmt(avgOrder),       sub: 'per transaction',  color: 'text-neutral-400', bg: 'bg-warning-50', icon: <Receipt className="w-4 h-4 text-warning-600" /> },
          { label: 'Refunds',          value: String(refundCount), sub: `${fmt(refundTotal)} refunded`, color: 'text-danger-600', bg: 'bg-danger-50', icon: <RefreshCw className="w-4 h-4 text-danger-600" /> },
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
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-neutral-400"
          />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All','Completed','Refunded','Voided','Pending'].map((s) => (
            <button key={s} onClick={() => setStatusFlt(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors
                ${statusFlt === s ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Pay method */}
        <select value={payFlt} onChange={(e) => setPayFlt(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
            text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
          <option value="All">All Methods</option>
          {['Cash','Card','GCash','Maya'].map((m) => <option key={m}>{m}</option>)}
        </select>

        {/* Date range */}
        <div className="ml-auto flex items-center gap-1.5">
          {['Today','Yesterday','Last 7 days','This Month'].map((d) => (
            <button key={d} onClick={() => setDateFlt(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                ${dateFlt === d ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {d}
            </button>
          ))}
        </div>
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
                  <span className="text-sm font-bold text-brand-600 font-mono">{t.txnNo}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-neutral-800">{formatDate(t.date)}</div>
                  <div className="text-[10px] text-neutral-400">{t.time}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-700">{t.cashier}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-neutral-600">
                    {t.items.length} {t.items.length === 1 ? 'item' : 'items'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    {PAY_ICON[t.payMethod]}
                    {t.payMethod}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-neutral-800">{fmt(t.total)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={
                    t.status === 'Completed' ? 'success' :
                    t.status === 'Refunded'  ? 'warning' :
                    t.status === 'Voided'    ? 'danger'  : 'info'
                  }>{t.status}</Badge>
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

        {paginated.length === 0 && (
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
        onClose={() => setDetail(null)}
        title={detail?.txnNo ?? ''}
        footer={
          <div className="px-6 py-4 flex gap-3">
            <button className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
              bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
              Print Receipt
            </button>
            {detail?.status === 'Completed' && (
              <button
                onClick={() => detail && issueRefund(detail.id)}
                className="flex-1 py-2.5 text-sm font-semibold text-white
                  bg-warning-600 rounded-lg hover:bg-warning-600/90 transition-colors">
                Issue Refund
              </button>
            )}
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
                  {formatDate(detail.date)} · {detail.time}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Cashier</span>
                <span className="text-xs font-semibold text-neutral-800">{detail.cashier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Status</span>
                <Badge variant={
                  detail.status === 'Completed' ? 'success' :
                  detail.status === 'Refunded'  ? 'warning' :
                  detail.status === 'Voided'    ? 'danger'  : 'info'
                }>{detail.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Payment</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                  {PAY_ICON[detail.payMethod]} {detail.payMethod}
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Items
              </div>
              <div className="space-y-2.5">
                {detail.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-800">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{item.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-neutral-800">
                        {fmt(item.price * item.qty)}
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
