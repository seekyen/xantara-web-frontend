'use client'

import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react'
import { type Product }                        from '@/lib/mock/products'
import { getAllProducts }                       from '@/lib/api/products'
import { MOCK_TRANSACTIONS, type Transaction } from '@/lib/mock/transactions'
import { MOCK_CUSTOMERS, type Customer }       from '@/lib/mock/customers'
import { MOCK_STAFF, type Staff }              from '@/lib/mock/staff'

const ACCESS_TOKEN_KEY = 'xantara_pos_access'

interface POSContextType {
  products:        Product[]
  setProducts:     Dispatch<SetStateAction<Product[]>>
  productsLoading: boolean
  transactions:    Transaction[]
  setTransactions: Dispatch<SetStateAction<Transaction[]>>
  customers:       Customer[]
  setCustomers:    Dispatch<SetStateAction<Customer[]>>
  staff:           Staff[]
  setStaff:        Dispatch<SetStateAction<Staff[]>>
}

const POSContext = createContext<POSContextType | null>(null)

export function POSProvider({ children }: { children: ReactNode }) {
  const [products,        setProducts]        = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [transactions,    setTransactions]    = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [customers,       setCustomers]       = useState<Customer[]>(MOCK_CUSTOMERS)
  const [staff,           setStaff]           = useState<Staff[]>(MOCK_STAFF)

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) { setProductsLoading(false); return }

    async function load() {
      try {
        const all = await getAllProducts(token ?? undefined)
        setProducts(all)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setProductsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <POSContext.Provider value={{
      products, setProducts, productsLoading,
      transactions, setTransactions,
      customers, setCustomers,
      staff, setStaff,
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
