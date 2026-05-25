'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/inventory':  'Inventory',
  '/dashboard/sales':      'Sales & Transactions',
  '/dashboard/customers':  'Customers',
  '/dashboard/reports':    'Reports & Analytics',
  '/dashboard/staff':      'Staff Management',
  '/dashboard/settings':   'Settings',
}

export default function TopBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const title    = PAGE_TITLES[pathname] ?? 'Xantara'

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-neutral-200
      flex items-center px-6 gap-4 z-20">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <img src="/images/x-logo.png" alt="Xantara" className="h-4 w-auto" />
        <ChevronRight className="w-3 h-3 text-neutral-300" />
        <span className="text-xs font-semibold text-neutral-800 truncate">{title}</span>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search…"
          className="pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200
            rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 w-56
            placeholder:text-neutral-400"
        />
      </div>

      {/* Notifications bell */}
      <button className="relative w-10 h-10 rounded-lg hover:bg-neutral-100
        flex items-center justify-center transition-colors">
        <Bell className="w-5 h-5 text-neutral-500" />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger-600" />
      </button>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center
        text-white text-xs font-bold cursor-pointer select-none">
        {user?.initials ?? '??'}
      </div>

    </header>
  )
}
