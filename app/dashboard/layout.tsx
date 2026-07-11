'use client'

import { useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import TopBar  from '@/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth()
  const router             = useRouter()

  useLayoutEffect(() => {
    if (hydrated && !user) router.replace('/login')
  }, [hydrated, user, router])

  // Hold render until auth state is known — avoids layout flash
  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
