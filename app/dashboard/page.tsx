'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Package, TrendingUp, Users, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { usePOS }          from '@/context/POSContext'
import { useAuth }         from '@/context/AuthContext'
import { getStatus }       from '@/lib/mock/products'
import StatCard            from '@/components/shared/StatCard'
import Badge               from '@/components/shared/Badge'
import { getWeeklySales, getTopProducts, type WeeklySalesPoint, type TopProduct } from '@/lib/api/reports'

const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined

function fmt(n: number) { return `₱${Number(n).toLocaleString('en-PH')}` }

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}

// ── Weekly bar chart (pure CSS) ───────────────────────────────────────────────
function WeeklyBarChart({ data }: { data: WeeklySalesPoint[] }) {
  const max = Math.max(...data.map((d) => d.sales), 1)
  const todayIdx = data.length - 1 // WeeklySalesView always ends on today
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => {
        const pct     = (d.sales / max) * 100
        const isToday = i === todayIdx
        return (
          <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1 h-full">
            <div className="flex-1 w-full flex items-end">
              <div
                className={`w-full rounded-t-md transition-all ${
                  isToday ? 'bg-brand-600' : 'bg-brand-50'
                }`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`text-[10px] font-medium ${isToday ? 'text-brand-600' : 'text-neutral-400'}`}>
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }                                = useAuth()
  const { products, transactions, customers }   = usePOS()

  const [weekly,       setWeekly]       = useState<WeeklySalesPoint[]>([])
  const [weeklyLoading, setWeeklyLoading] = useState(true)
  const [topProducts,  setTopProducts]  = useState<TopProduct[]>([])
  const [topLoading,   setTopLoading]   = useState(true)

  useEffect(() => {
    const token = authToken()
    let cancelled = false
    getWeeklySales(token).then((w) => { if (!cancelled) setWeekly(w) })
      .catch(() => {}).finally(() => { if (!cancelled) setWeeklyLoading(false) })
    getTopProducts({ limit: 5 }, token).then((tp) => { if (!cancelled) setTopProducts(tp) })
      .catch(() => {}).finally(() => { if (!cancelled) setTopLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ── Derived stats (computed from the real products/transactions/customers already
  //    loaded into POSContext, so these numbers agree with the Sales/Customers pages) ──
  const today        = new Date()
  const todayTxns     = transactions.filter((t) => isSameDay(t.created_at, today))
  const todayRev      = todayTxns.filter((t) => t.status === 'completed').reduce((s, t) => s + Number(t.total), 0)
  const lowStockCnt   = products.filter((p) => getStatus(p) === 'Low Stock').length
  const outOfStk      = products.filter((p) => getStatus(p) === 'Out of Stock').length
  const activeCust    = customers.filter((c) => c.status === 'active').length
  const startOfMonth  = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const newCustThisMo = customers.filter((c) => new Date(c.joined_at) >= startOfMonth).length
  const recentTxns    = [...transactions].sort((a, b) => b.txn_no.localeCompare(a.txn_no)).slice(0, 5)
  const alertItems    = products.filter((p) => getStatus(p) !== 'In Stock').slice(0, 6)

  const maxTopRev = topProducts[0]?.total_revenue || 1

  const [dashStockFilter, setDashStockFilter] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All')
  const filteredAlerts = alertItems.filter((p) =>
    dashStockFilter === 'All' ? true : getStatus(p) === dashStockFilter
  )

  const [greeting, setGreeting] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hour = new Date().getHours()
      setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="pb-8">

      {/* ── Hero gradient card ── */}
      <div className="mx-6 mt-6 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-100 text-sm font-medium">
              {greeting} 👋
            </p>
            <h2 className="text-xl font-bold mt-0.5">{user?.name}</h2>
            <p className="text-brand-100 text-xs mt-0.5">{user?.branch_name} Branch · {user?.role}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center
            text-white text-sm font-bold">
            {user?.initials}
          </div>
        </div>
        {/* Quick stats on hero */}
        <div className="mt-5 flex gap-6">
          <div>
            <div className="text-2xl font-bold">{fmt(todayRev)}</div>
            <div className="text-brand-100 text-xs mt-0.5">Today&apos;s revenue</div>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <div className="text-2xl font-bold">{todayTxns.length}</div>
            <div className="text-brand-100 text-xs mt-0.5">Transactions today</div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        <StatCard
          label="Today's Revenue" value={fmt(todayRev)}
          sub="today" subColor="text-neutral-400"
          icon={<TrendingUp className="w-4 h-4 text-brand-600" />} iconBg="bg-brand-50"
        />
        <StatCard
          label="Total Products" value={String(products.length)}
          sub={`${lowStockCnt} low stock`} subColor="text-warning-600"
          icon={<Package className="w-4 h-4 text-success-600" />} iconBg="bg-success-50"
        />
        <StatCard
          label="Active Customers" value={String(activeCust)}
          sub={`${newCustThisMo} new this month`} subColor="text-neutral-400"
          icon={<Users className="w-4 h-4 text-warning-600" />} iconBg="bg-warning-50"
        />
        <StatCard
          label="Pending Alerts" value={String(lowStockCnt + outOfStk)}
          sub={`${outOfStk} out of stock`} subColor="text-danger-600"
          icon={<AlertTriangle className="w-4 h-4 text-danger-600" />} iconBg="bg-danger-50"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 mb-4">

        {/* Weekly sales bar chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-neutral-800">Weekly Sales</h3>
            <span className="text-xs text-neutral-400">Last 7 days</span>
          </div>
          {weeklyLoading ? (
            <div className="flex items-center justify-center gap-2 h-44 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading…</span>
            </div>
          ) : (
            <>
              <div className="text-xs text-neutral-400 mb-4">
                This week · {fmt(weekly.reduce((s, d) => s + d.sales, 0))} total
              </div>
              <WeeklyBarChart data={weekly} />
            </>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-800">Top Products</h3>
            <Link href="/dashboard/inventory"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading…</span>
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-xs text-neutral-400">No completed sales yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const w = Math.round((p.total_revenue / maxTopRev) * 100)
                return (
                  <div key={p.product__id ?? i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-neutral-800 truncate">{p.product__descshort ?? 'Unknown product'}</span>
                        <span className="text-xs font-bold text-brand-600 ml-2">{fmt(p.total_revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full">
                        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 w-12 text-right">{p.total_qty} sold</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6">

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-800">Recent Transactions</h3>
            <Link href="/dashboard/sales"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <p className="text-xs text-neutral-400">No transactions yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentTxns.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-600 font-mono">{t.txn_no}</span>
                      <Badge variant={
                        t.status === 'completed' ? 'success' :
                        t.status === 'refunded'  ? 'warning' :
                        t.status === 'voided'    ? 'danger'  : 'info'
                      }>{t.status_display}</Badge>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {t.cashier_name ?? '—'} · {t.pay_display}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-800">{fmt(t.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-800">Stock Alerts</h3>
            <Link href="/dashboard/inventory"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Segmented stock status toggle */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 mb-4">
            {([
              { label: 'All',          count: lowStockCnt + outOfStk },
              { label: 'Low Stock',    count: lowStockCnt             },
              { label: 'Out of Stock', count: outOfStk                },
            ] as const).map(({ label, count }) => (
              <button key={label}
                onClick={() => setDashStockFilter(label)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all
                  ${dashStockFilter === label
                    ? 'bg-white text-neutral-800 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                  }`}>
                {label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${dashStockFilter === label
                    ? label === 'Out of Stock' ? 'bg-danger-100 text-danger-600'
                      : label === 'Low Stock'  ? 'bg-warning-100 text-warning-600'
                      : 'bg-neutral-100 text-neutral-500'
                    : 'bg-neutral-200 text-neutral-400'
                  }`}>{count}</span>
              </button>
            ))}
          </div>

          {filteredAlerts.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-4">
              {dashStockFilter === 'All' ? 'All products are well-stocked.' : `No ${dashStockFilter} products.`}
            </p>
          ) : (
            <div className="space-y-2.5">
              {filteredAlerts.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-neutral-800 truncate">{p.descshort}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{p.itemcode}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      p.total_stock === 0 ? 'text-danger-600' : 'text-warning-600'
                    }`}>{p.total_stock} left</span>
                    <Badge variant={p.total_stock === 0 ? 'danger' : 'warning'}>
                      {getStatus(p)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
