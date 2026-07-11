'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home, Package, Receipt, Users, BarChart2, UserCog, Settings, LogOut,
  GitBranch, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// ── Nav item types ────────────────────────────────────────────────────────────

type FlatItem = {
  type:  'flat'
  href:  string
  icon:  React.ComponentType<{ className?: string }>
  label: string
}

type GroupItem = {
  type:     'group'
  key:      string
  icon:     React.ComponentType<{ className?: string }>
  label:    string
  children: { href: string; label: string; exact?: boolean }[]
}

type NavItem = FlatItem | GroupItem

// ── Nav definition ────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { type: 'flat', href: '/dashboard',                          icon: Home,      label: 'Dashboard'         },
  { type: 'flat', href: '/dashboard/inventory',                icon: Package,   label: 'Inventory'         },
  { type: 'flat', href: '/dashboard/sales',                    icon: Receipt,   label: 'Sales'             },
  { type: 'flat', href: '/dashboard/customers',                icon: Users,     label: 'Customers'         },
  { type: 'flat', href: '/dashboard/reports',                  icon: BarChart2, label: 'Reports'           },
  { type: 'flat', href: '/dashboard/staff',                    icon: UserCog,   label: 'Staff'             },
  {
    type:  'group',
    key:   'branches',
    icon:  GitBranch,
    label: 'Branches',
    children: [
      { href: '/dashboard/branches',               label: 'Branches',    exact: true },
      { href: '/dashboard/branches/inventory',     label: 'Inventory'     },
      { href: '/dashboard/branches/staff',         label: 'Staff'         },
      { href: '/dashboard/branches/configuration', label: 'Configuration' },
    ],
  },
  { type: 'flat', href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname         = usePathname()
  const router           = useRouter()
  const { user, logout } = useAuth()

  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // Keep the group open when the active route is one of its children.
  useEffect(() => {
    for (const item of NAV_ITEMS) {
      if (item.type === 'group') {
        const childActive = item.children.some((c) =>
          c.exact ? pathname === c.href : pathname === c.href || pathname.startsWith(c.href + '/'),
        )
        if (childActive) {
          setOpenGroup(item.key)
          return
        }
      }
    }
  }, [pathname])

  const toggleGroup = (key: string) =>
    setOpenGroup((prev) => (prev === key ? null : key))

  const isFlat = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/')

  const isGroupActive = (item: GroupItem) =>
    item.children.some((c) =>
      c.exact ? pathname === c.href : pathname === c.href || pathname.startsWith(c.href + '/'),
    )

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
        {NAV_ITEMS.map((item) => {
          if (item.type === 'flat') {
            const active = isFlat(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg mb-0.5
                  text-sm font-medium transition-colors
                  ${active
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
              </Link>
            )
          }

          // Group item
          const isOpen   = openGroup === item.key
          const hasActive = isGroupActive(item)

          return (
            <div key={item.key} className="mb-0.5">
              <button
                onClick={() => toggleGroup(item.key)}
                className={`w-[calc(100%-1.5rem)] mx-3 flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-sm font-medium transition-colors
                  ${hasActive
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200
                    ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="mx-3 mt-0.5 mb-1 overflow-hidden">
                  {item.children.map((child) => {
                    const childActive = child.exact
                      ? pathname === child.href
                      : pathname === child.href || pathname.startsWith(child.href + '/')
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 pl-9 pr-3 py-2 rounded-lg
                          text-sm transition-colors mb-0.5
                          ${childActive
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                          ${childActive ? 'bg-white' : 'bg-neutral-600'}`}
                        />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
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
