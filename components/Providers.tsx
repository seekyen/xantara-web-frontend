'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { POSProvider }  from '@/context/POSContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <POSProvider>
        {children}
      </POSProvider>
    </AuthProvider>
  )
}
