'use client'

import { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react'

// Runs before first paint on client; falls back to useEffect on server (SSR-safe) —
// mirrors AuthContext's helper. Needed here (not plain useEffect) because the branch
// below can call setState synchronously when there's no session to fetch for.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
import { type Product }               from '@/lib/mock/products'
import { getAllProducts }             from '@/lib/api/products'
import { type Transaction }           from '@/lib/api/sales'
import { getAllTransactions }         from '@/lib/api/sales'
import { type Customer }              from '@/lib/api/customers'
import { getAllCustomers }            from '@/lib/api/customers'
import { type Staff }                 from '@/lib/api/staff'
import { getAllStaff }                from '@/lib/api/staff'
import { useAuth }                    from '@/context/AuthContext'

const ACCESS_TOKEN_KEY = 'xantara_pos_access'

interface POSContextType {
  products:           Product[]
  setProducts:        Dispatch<SetStateAction<Product[]>>
  productsLoading:    boolean
  transactions:       Transaction[]
  setTransactions:    Dispatch<SetStateAction<Transaction[]>>
  transactionsLoading: boolean
  customers:          Customer[]
  setCustomers:       Dispatch<SetStateAction<Customer[]>>
  customersLoading:   boolean
  staff:              Staff[]
  setStaff:           Dispatch<SetStateAction<Staff[]>>
  staffLoading:       boolean
}

const POSContext = createContext<POSContextType | null>(null)

export function POSProvider({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth()

  const [products,        setProducts]        = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [transactions,        setTransactions]        = useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [customers,        setCustomers]        = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [staff,            setStaff]            = useState<Staff[]>([])
  const [staffLoading,     setStaffLoading]      = useState(true)

  // Providers.tsx mounts this once at the app root, above both /login and /dashboard,
  // so it must react to auth state rather than fetch once on mount — a plain `[]`
  // dependency array would only ever see the pre-login (tokenless) state and never
  // re-run after a client-side login redirect, leaving every list empty until a
  // full page reload.
  useIsomorphicLayoutEffect(() => {
    if (!hydrated) return
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!user || !token) {
      setProducts([]);     setProductsLoading(false)
      setTransactions([]); setTransactionsLoading(false)
      setCustomers([]);    setCustomersLoading(false)
      setStaff([]);        setStaffLoading(false)
      return
    }

    let cancelled = false
    setProductsLoading(true)
    setTransactionsLoading(true)
    setCustomersLoading(true)
    setStaffLoading(true)

    getAllProducts(token)
      .then((all) => { if (!cancelled) setProducts(all) })
      .catch((err) => console.error('Failed to fetch products:', err))
      .finally(() => { if (!cancelled) setProductsLoading(false) })

    getAllTransactions(token)
      .then((all) => { if (!cancelled) setTransactions(all) })
      .catch((err) => console.error('Failed to fetch transactions:', err))
      .finally(() => { if (!cancelled) setTransactionsLoading(false) })

    getAllCustomers(token)
      .then((all) => { if (!cancelled) setCustomers(all) })
      .catch((err) => console.error('Failed to fetch customers:', err))
      .finally(() => { if (!cancelled) setCustomersLoading(false) })

    getAllStaff(token)
      .then((all) => { if (!cancelled) setStaff(all) })
      .catch((err) => console.error('Failed to fetch staff:', err))
      .finally(() => { if (!cancelled) setStaffLoading(false) })

    return () => { cancelled = true }
  }, [user, hydrated])

  return (
    <POSContext.Provider value={{
      products, setProducts, productsLoading,
      transactions, setTransactions, transactionsLoading,
      customers, setCustomers, customersLoading,
      staff, setStaff, staffLoading,
    }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error('usePOS must be inside POSProvider')
  return ctx
}
