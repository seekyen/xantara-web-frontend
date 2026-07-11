'use client'

// TODO: Replace MOCK_DATA with API call → GET /api/reports?period=weekly

import { useState } from 'react'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import {
  WEEKLY_SALES, MONTHLY_SALES, HOURLY_SALES,
  CATEGORY_BREAKDOWN, PAYMENT_BREAKDOWN,
} from '@/lib/mock/reports'
import { usePOS } from '@/context/POSContext'

type Period = 'Today' | 'This Week' | 'This Month'

function fmt(n: number) { return `₱${n.toLocaleString('en-PH')}` }

// ── Bar chart (pure CSS divs) ─────────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, highlightIdx }: {
  data: Record<string, unknown>[]
  labelKey: string
  valueKey: string
  highlightIdx?: number
}) {
  const values = data.map((d) => Number(d[valueKey]))
  const max    = Math.max(...values) || 1
  return (
    <div className="flex items-end gap-1.5 h-44">
      {data.map((d, i) => {
        const val  = Number(d[valueKey])
        const pct  = (val / max) * 100
        const isHi = highlightIdx !== undefined ? i === highlightIdx : i === data.length - 1
        return (
          <div key={String(d[labelKey])} className="flex flex-col items-center gap-1 flex-1 h-full group">
            <div className="flex-1 w-full flex items-end relative">
              <div
                className={`w-full rounded-t-sm transition-all ${isHi ? 'bg-brand-600' : 'bg-brand-50'}`}
                style={{ height: `${pct}%` }}
              />
              {/* Hover tooltip */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block
                text-[10px] font-semibold text-neutral-800 whitespace-nowrap bg-white
                border border-neutral-200 rounded px-1.5 py-0.5 shadow-sm">
                {fmt(val)}
              </div>
            </div>
            <span className={`text-[10px] font-medium ${isHi ? 'text-brand-600' : 'text-neutral-400'}`}>
              {String(d[labelKey])}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { transactions, products } = usePOS()
  const [period, setPeriod]        = useState<Period>('This Week')

  const chartData =
    period === 'Today'      ? HOURLY_SALES.map((h) => ({ label: h.hour,  value: h.sales })) :
    period === 'This Week'  ? WEEKLY_SALES.map((d) => ({ label: d.day,   value: d.sales })) :
    MONTHLY_SALES.map((m) => ({ label: m.month, value: m.sales }))

  const periodRevenue = chartData.reduce((s, d) => s + d.value, 0)
  const periodOrders  = period === 'This Week'
    ? WEEKLY_SALES.reduce((s, d) => s + d.txns, 0)
    : period === 'This Month' ? MONTHLY_SALES.reduce((s, d) => s + d.txns, 0)
    : transactions.filter((t) => t.date === '2026-05-24').length
  const avgOrder      = periodOrders ? Math.round(periodRevenue / periodOrders) : 0
  const returnRate    = 2.1

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
  const maxProdRev = topProducts[0]
    ? topProducts[0].sell_price_rp * (soldByProduct[String(topProducts[0].id)] ?? 0)
    : 1

  const maxHourly = Math.max(...HOURLY_SALES.map((h) => h.sales))

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Reports & Analytics</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            {(['Today','This Week','This Month'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
                  ${period === p ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold
            text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: 'Net Revenue',      value: fmt(periodRevenue), sub: '+18% vs last period', trend: 'up'      as const, color: 'text-success-600' },
          { label: 'Total Orders',     value: String(periodOrders), sub: '+12%',              trend: 'up'      as const, color: 'text-success-600' },
          { label: 'Avg Order Value',  value: fmt(avgOrder),       sub: '+5%',                trend: 'up'      as const, color: 'text-success-600' },
          { label: 'Return Rate',      value: `${returnRate}%`,    sub: '-0.3%',              trend: 'down'    as const, color: 'text-success-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{s.label}</span>
              {s.trend === 'up'
                ? <TrendingUp   className="w-4 h-4 text-success-600" />
                : <TrendingDown className="w-4 h-4 text-danger-600"  />
              }
            </div>
            <div className="text-2xl font-bold text-neutral-800">{s.value}</div>
            <div className={`text-xs mt-1 ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 mb-4">

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-neutral-800">Revenue Over Time</h3>
            <span className="text-xs text-neutral-400">{period}</span>
          </div>
          <div className="text-xs text-neutral-400 mb-4">{fmt(periodRevenue)} total</div>
          <BarChart
            data={chartData}
            labelKey="label"
            valueKey="value"
          />
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {CATEGORY_BREAKDOWN.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-700">{c.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">{c.percentage}%</span>
                    <span className="text-xs font-bold text-brand-600">{fmt(c.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom 3-col section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6">

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-4">Payment Methods</h3>
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {PAYMENT_BREAKDOWN.map((p) => (
              <div
                key={p.method}
                style={{ width: `${p.percentage}%`, backgroundColor: p.color }}
                title={`${p.method}: ${p.percentage}%`}
              />
            ))}
          </div>
          <div className="space-y-2.5">
            {PAYMENT_BREAKDOWN.map((p) => (
              <div key={p.method} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-semibold text-neutral-700">{p.method}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-neutral-800">{p.percentage}%</span>
                  <span className="text-[10px] text-neutral-400 ml-1.5">{fmt(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 products */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const rev = p.sell_price_rp * (soldByProduct[String(p.id)] ?? 0)
              const w   = Math.round((rev / maxProdRev) * 100)
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-neutral-800 truncate">{p.descshort}</span>
                      <span className="text-xs font-bold text-brand-600 ml-2 whitespace-nowrap">{fmt(rev)}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full">
                      <div className="h-full bg-brand-600 rounded-full" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hourly heatmap */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-1">Hourly Activity</h3>
          <p className="text-xs text-neutral-400 mb-4">Darker = more sales</p>
          <div className="space-y-1.5">
            <div className="grid grid-cols-6 gap-1">
              {HOURLY_SALES.slice(0, 6).map((h) => (
                <div key={h.hour}
                  className="h-8 rounded-sm bg-brand-600 cursor-default"
                  style={{ opacity: Math.max(0.1, h.sales / maxHourly) }}
                  title={`${h.hour}: ${fmt(h.sales)}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {HOURLY_SALES.slice(6).map((h) => (
                <div key={h.hour}
                  className="h-8 rounded-sm bg-brand-600 cursor-default"
                  style={{ opacity: Math.max(0.1, h.sales / maxHourly) }}
                  title={`${h.hour}: ${fmt(h.sales)}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {HOURLY_SALES.slice(0, 6).map((h) => (
                <div key={h.hour} className="text-[9px] text-neutral-400 text-center">{h.hour}</div>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {HOURLY_SALES.slice(6).map((h) => (
                <div key={h.hour} className="text-[9px] text-neutral-400 text-center">{h.hour}</div>
              ))}
            </div>
          </div>
          {/* Peak hours callout */}
          <div className="mt-3 p-3 bg-brand-50 rounded-lg">
            <p className="text-xs text-neutral-600">
              Peak hour:{' '}
              <span className="font-bold text-brand-600">
                {HOURLY_SALES.reduce((a, b) => a.sales > b.sales ? a : b).hour}
              </span>{' '}
              · {fmt(Math.max(...HOURLY_SALES.map((h) => h.sales)))}
            </p>
          </div>
        </div>

      </div>

      {/* ── Weekly summary table ── */}
      <div className="mx-6 mt-4 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-800">Weekly Summary</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              {['Day','Revenue','Transactions','Avg Order'].map((h) => (
                <th key={h}
                  className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                    ${h !== 'Day' ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {WEEKLY_SALES.map((d, i) => {
              const avg = d.txns ? Math.round(d.sales / d.txns) : 0
              const isToday = i === 5
              return (
                <tr key={d.day} className={`${isToday ? 'bg-brand-50' : 'hover:bg-neutral-50'} transition-colors`}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${isToday ? 'text-brand-600' : 'text-neutral-800'}`}>
                      {d.day}{isToday ? ' (today)' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-neutral-800">{fmt(d.sales)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-neutral-600">{d.txns}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-neutral-600">{fmt(avg)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
