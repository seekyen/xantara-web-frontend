import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label:     string
  value:     string
  sub?:      string
  subColor?: string
  icon:      ReactNode
  iconBg:    string
  trend?:    'up' | 'down' | 'neutral'
}

export default function StatCard({
  label, value, sub, subColor = 'text-neutral-400', icon, iconBg, trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-neutral-800">{value}</div>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up'   && <TrendingUp   className="w-3 h-3 text-success-600" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-danger-600"  />}
          <span className={`text-xs ${subColor}`}>{sub}</span>
        </div>
      )}
    </div>
  )
}
