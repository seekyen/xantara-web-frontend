'use client'

import { Fragment, useState } from 'react'
import { X, PackageSearch, ChevronDown, ChevronRight } from 'lucide-react'
import { type Supplier } from '@/lib/api/suppliers/supplier'
import { MOCK_PRODUCT_ORDERS, MOCK_PURCHASE_ORDERS, type POStatus } from '@/lib/mock/supplierOrders'
import Badge from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'

const TABS = ['Product Orders', 'PO'] as const
type Tab = typeof TABS[number]

function fmt(n: number) { return `₱${n.toLocaleString('en-PH')}` }

const STATUS_VARIANT: Record<POStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  Draft:     'neutral',
  Sent:      'warning',
  Received:  'success',
  Cancelled: 'danger',
}

export default function SupplierOrdersDialog({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('Product Orders')
  const [expandedPoId, setExpandedPoId] = useState<number | null>(null)

  const productOrders = MOCK_PRODUCT_ORDERS.filter((o) => o.supplierId === supplier.id)
  const purchaseOrders = MOCK_PURCHASE_ORDERS.filter((po) => po.supplierId === supplier.id)
  const toggleExpanded = (poId: number) => setExpandedPoId((prev) => prev === poId ? null : poId)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-[95vw] max-w-3xl h-[80vh]
            flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-neutral-800">{supplier.company_name}</h2>
              <p className="text-xs text-neutral-400 font-mono">{supplier.supplier_code}</p>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          <div className="px-6 pt-3 flex-shrink-0">
            <div className="flex border-b border-neutral-200">
              {TABS.map((tab) => {
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`relative -mb-px flex-1 px-2 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-neutral-200
                      rounded-t-lg text-center transition-colors
                      ${isActive
                        ? 'bg-white text-neutral-800 border-b-white z-10'
                        : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                      }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
            {activeTab === 'Product Orders' && (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      {['Product/Item', 'Quantity', 'Unit Cost', 'Total', 'Order Date'].map((h) => (
                        <th key={h}
                          className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                            ${h === 'Product/Item' ? 'text-left' : 'text-right'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {productOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-neutral-800">{o.productName}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600 text-right">{o.quantity}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600 text-right">{fmt(o.unitCost)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-neutral-800 text-right">{fmt(o.total)}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600 text-right">{o.orderDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productOrders.length === 0 && (
                  <EmptyState
                    icon={<PackageSearch className="w-6 h-6 text-brand-600" />}
                    title="No product orders yet"
                    description="Orders placed with this supplier will show up here"
                  />
                )}
              </div>
            )}

            {activeTab === 'PO' && (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      {['PO Number', 'Date Created', 'Status', 'Total Amount'].map((h, i) => (
                        <th key={h}
                          className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                            ${i === 0 ? 'text-left' : h === 'Status' ? 'text-center' : 'text-right'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {purchaseOrders.map((po) => {
                      const isExpanded = expandedPoId === po.id
                      const items = MOCK_PRODUCT_ORDERS.filter((o) => o.poId === po.id)
                      return (
                        <Fragment key={po.id}>
                          <tr onClick={() => toggleExpanded(po.id)}
                            className="hover:bg-neutral-50 transition-colors cursor-pointer">
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-800 font-mono">
                              <div className="flex items-center gap-1.5">
                                {isExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />}
                                {po.poNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-600 text-right">{po.dateCreated}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center">
                                <Badge variant={STATUS_VARIANT[po.status]}>{po.status}</Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-800 text-right">{fmt(po.totalAmount)}</td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="px-4 py-3 bg-neutral-50">
                                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-neutral-100">
                                        {['Product/Item', 'Quantity', 'Unit Cost', 'Total'].map((h, i) => (
                                          <th key={h}
                                            className={`px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide
                                              ${i === 0 ? 'text-left' : 'text-right'}`}>
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                      {items.map((item) => (
                                        <tr key={item.id}>
                                          <td className="px-3 py-2 text-xs font-semibold text-neutral-700">{item.productName}</td>
                                          <td className="px-3 py-2 text-xs text-neutral-600 text-right">{item.quantity}</td>
                                          <td className="px-3 py-2 text-xs text-neutral-600 text-right">{fmt(item.unitCost)}</td>
                                          <td className="px-3 py-2 text-xs font-semibold text-neutral-700 text-right">{fmt(item.total)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {items.length === 0 && (
                                    <p className="text-xs text-neutral-400 text-center py-3">No line items recorded for this PO.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
                {purchaseOrders.length === 0 && (
                  <EmptyState
                    icon={<PackageSearch className="w-6 h-6 text-brand-600" />}
                    title="No purchase orders yet"
                    description="POs raised for this supplier will show up here"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
