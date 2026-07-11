'use client'

// TODO: Replace MOCK_DATA with API call → GET /api/dashboard/summary

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Package, TrendingUp, Users, AlertTriangle, ArrowRight } from 'lucide-react'
import { usePOS }          from '@/context/POSContext'
import { useAuth }         from '@/context/AuthContext'
import { getStatus }       from '@/lib/mock/products'
import StatCard            from '@/components/shared/StatCard'
import Badge               from '@/components/shared/Badge'
import { WEEKLY_SALES }    from '@/lib/mock/reports'

function fmt(n: number) { return `₱${n.toLocaleString('en-PH')}` }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Weekly bar chart (pure CSS) ───────────────────────────────────────────────
function WeeklyBarChart() {
  const max = Math.max(...WEEKLY_SALES.map((d) => d.sales))
  // Saturday index (5) is "today" in mock data — highest sales day
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {WEEKLY_SALES.map((d, i) => {
        const pct     = (d.sales / max) * 100
        const isToday = i === 5
        return (
          <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1 h-full">
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
  const { user }                              = useAuth()
  const { products, transactions, customers } = usePOS()

  // ── Derived stats ──
  const todayTxns    = transactions.filter((t) => t.date === '2026-05-24')
  const todayRev     = todayTxns.filter((t) => t.status === 'Completed').reduce((s, t) => s + t.total, 0)
  const lowStockCnt  = products.filter((p) => getStatus(p) === 'Low Stock').length
  const outOfStk     = products.filter((p) => getStatus(p) === 'Out of Stock').length
  const activeCust   = customers.filter((c) => c.status === 'Active').length
  const recentTxns   = [...transactions].sort((a, b) => b.txnNo.localeCompare(a.txnNo)).slice(0, 5)
  const alertItems   = products.filter((p) => getStatus(p) !== 'In Stock').slice(0, 6)

  // Units sold per product, aggregated from completed transactions
  const soldByProduct = transactions.reduce<Record<string, number>>((acc, t) => {
    if (t.status === 'Completed') {
      t.items.forEach((item) => { acc[item.productId] = (acc[item.productId] ?? 0) + item.qty })
    }
    return acc
  }, {})

  // Top 5 products by revenue (sell_price_rp × units sold)
  const topProducts = [...products]
    .sort((a, b) =>
      b.sell_price_rp * (soldByProduct[String(b.id)] ?? 0) -
      a.sell_price_rp * (soldByProduct[String(a.id)] ?? 0)
    )
    .slice(0, 5)
  const maxRev = topProducts[0]
    ? topProducts[0].sell_price_rp * (soldByProduct[String(topProducts[0].id)] ?? 0)
    : 1

  const inStockCnt   = products.filter((p) => getStatus(p) === 'In Stock').length
  const [dashStockFilter, setDashStockFilter] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All')
  const filteredAlerts = alertItems.filter((p) =>
    dashStockFilter === 'All' ? true : getStatus(p) === dashStockFilter
  )

  const [greeting, setGreeting] = useState('')
  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
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
          sub="+12% vs yesterday" subColor="text-success-600" trend="up"
          icon={<TrendingUp className="w-4 h-4 text-brand-600" />} iconBg="bg-brand-50"
        />
        <StatCard
          label="Total Products" value={String(products.length)}
          sub={`${lowStockCnt} low stock`} subColor="text-warning-600"
          icon={<Package className="w-4 h-4 text-success-600" />} iconBg="bg-success-50"
        />
        <StatCard
          label="Active Customers" value={String(activeCust)}
          sub="3 new this month" subColor="text-neutral-400"
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
            <span className="text-xs text-neutral-400">Mon – Sun</span>
          </div>
          <div className="text-xs text-neutral-400 mb-4">
            This week · {fmt(WEEKLY_SALES.reduce((s, d) => s + d.sales, 0))} total
          </div>
          <WeeklyBarChart />
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
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const sold = soldByProduct[String(p.id)] ?? 0
              const rev  = p.sell_price_rp * sold
              const w    = Math.round((rev / maxRev) * 100)
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-neutral-800 truncate">{p.descshort}</span>
                      <span className="text-xs font-bold text-brand-600 ml-2">{fmt(rev)}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full">
                      <div className="h-full bg-brand-600 rounded-full" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 w-12 text-right">{sold} sold</span>
                </div>
              )
            })}
          </div>
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
          <div className="space-y-2.5">
            {recentTxns.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-600 font-mono">{t.txnNo}</span>
                    <Badge variant={
                      t.status === 'Completed' ? 'success' :
                      t.status === 'Refunded'  ? 'warning' :
                      t.status === 'Voided'    ? 'danger'  : 'info'
                    }>{t.status}</Badge>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {t.cashier} · {t.payMethod}
                  </div>
                </div>
                <span className="text-sm font-bold text-neutral-800">{fmt(t.total)}</span>
              </div>
            ))}
          </div>
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
