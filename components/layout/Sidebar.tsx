'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Package, Receipt, Users, BarChart2, UserCog, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { href: '/dashboard',           icon: Home,      label: 'Dashboard'  },
  { href: '/dashboard/inventory', icon: Package,   label: 'Inventory'  },
  { href: '/dashboard/sales',     icon: Receipt,   label: 'Sales'      },
  { href: '/dashboard/customers', icon: Users,     label: 'Customers'  },
  { href: '/dashboard/reports',   icon: BarChart2, label: 'Reports'    },
  { href: '/dashboard/staff',     icon: UserCog,   label: 'Staff'      },
  { href: '/dashboard/settings',  icon: Settings,  label: 'Settings'   },
]

export default function Sidebar() {
  const pathname         = usePathname()
  const router           = useRouter()
  const { user, logout } = useAuth()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-neutral-800 flex flex-col z-30">

      {/* ── Logo ── */}
      <div className="px-5 py-4 border-b border-white/10">
        <img src="/images/xantara-logo.png" alt="Xantara" className="h-8 w-auto brightness-0 invert" />
        <div className="text-neutral-400 text-[10px] mt-1">{user?.branch_name ?? ''} Branch</div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg mb-0.5
              text-sm font-medium transition-colors
              ${isActive(href)
                ? 'bg-brand-600 text-white'
                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* ── User card + logout ── */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center
            text-white text-xs font-bold flex-shrink-0">
            {user?.initials ?? '??'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-neutral-400 text-[10px] truncate">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-7 h-7 rounded-md flex items-center justify-center
              text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Sync indicator */}
        <div className="flex items-center gap-1.5 px-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-success-600" />
          <span className="text-[10px] text-neutral-400">Synced</span>
        </div>
      </div>

    </aside>
  )
}
