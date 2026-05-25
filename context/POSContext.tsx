'use client'

// TODO: Replace initial state with API calls — GET /api/products, /api/transactions, etc.
// Each setter becomes the mutate() fn from SWR or a mutation from React Query.

import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react'
import { MOCK_PRODUCTS, type Product }       from '@/lib/mock/products'
import { MOCK_TRANSACTIONS, type Transaction } from '@/lib/mock/transactions'
import { MOCK_CUSTOMERS, type Customer }     from '@/lib/mock/customers'
import { MOCK_STAFF, type Staff }            from '@/lib/mock/staff'

interface POSContextType {
  products:        Product[]
  setProducts:     Dispatch<SetStateAction<Product[]>>
  transactions:    Transaction[]
  setTransactions: Dispatch<SetStateAction<Transaction[]>>
  customers:       Customer[]
  setCustomers:    Dispatch<SetStateAction<Customer[]>>
  staff:           Staff[]
  setStaff:        Dispatch<SetStateAction<Staff[]>>
}

const POSContext = createContext<POSContextType | null>(null)

export function POSProvider({ children }: { children: ReactNode }) {
  const [products,     setProducts]     = useState<Product[]>(MOCK_PRODUCTS)
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [customers,    setCustomers]    = useState<Customer[]>(MOCK_CUSTOMERS)
  const [staff,        setStaff]        = useState<Staff[]>(MOCK_STAFF)

  return (
    <POSContext.Provider value={{
      products, setProducts,
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
