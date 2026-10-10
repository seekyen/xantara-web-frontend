'use client'

import { Fragment, useEffect, useState } from 'react'
import { X, PackageSearch, ChevronDown, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { type Supplier } from '@/lib/api/suppliers/supplier'
import {
  type PurchaseOrder, type POStatus, type PurchaseOrderLineWriteData, type ReceiveLineInput,
  getPurchaseOrders, createPurchaseOrder, sendPurchaseOrder, cancelPurchaseOrder,
  receivePurchaseOrder, closePurchaseOrder,
} from '@/lib/api/suppliers/purchaseOrder'
import { getAllProducts } from '@/lib/api/products'
import { type Product } from '@/lib/mock/products'
import Badge from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'

const TABS = ['Product Orders', 'PO'] as const
type Tab = typeof TABS[number]

function fmt(n: number) { return `₱${n.toLocaleString('en-PH')}` }
const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined
const todayIso = () => new Date().toISOString().slice(0, 10)

const STATUS_VARIANT: Record<POStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info'> = {
  draft:               'neutral',
  sent:                'warning',
  partially_received:  'info',
  received:            'success',
  cancelled:           'danger',
}

interface DraftLine { product: string; quantity: string; unit_cost: string; expiry_date: string }
const emptyLine = (): DraftLine => ({ product: '', quantity: '', unit_cost: '', expiry_date: '' })

export default function SupplierOrdersDialog({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('Product Orders')
  const [expandedPoId, setExpandedPoId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [busyPoId, setBusyPoId] = useState<number | null>(null)

  const [showNewPo, setShowNewPo] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null)
  const [receiveQty, setReceiveQty] = useState<Record<number, string>>({})
  const [receiveExpiry, setReceiveExpiry] = useState<Record<number, string>>({})
  const [receiveDate, setReceiveDate] = useState('')
  const [receiving, setReceiving] = useState(false)

  const loadOrders = () => {
    const token = authToken()
    return getPurchaseOrders(supplier.id, token).then(setPurchaseOrders)
  }

  useEffect(() => {
    loadOrders().catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier.id])

  const openNewPo = () => {
    setShowNewPo(true)
    if (products.length === 0) {
      setProductsLoading(true)
      getAllProducts(authToken())
        .then((all) => setProducts(all.filter((p) => p.active)))
        .catch(() => {})
        .finally(() => setProductsLoading(false))
    }
  }

  const updateLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((prev) => [...prev, emptyLine()])
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i))

  const resetNewPoForm = () => {
    setShowNewPo(false)
    setLines([emptyLine()])
    setNotes('')
  }

  const handleCreate = async () => {
    const payloadLines: PurchaseOrderLineWriteData[] = []
    for (const l of lines) {
      if (!l.product || !l.quantity || !l.unit_cost) continue
      payloadLines.push({
        product:     Number(l.product),
        quantity:    Number(l.quantity),
        unit_cost:   Number(l.unit_cost),
        expiry_date: l.expiry_date || null,
      })
    }
    if (payloadLines.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Add at least one product line' })
      return
    }
    setCreating(true)
    try {
      await createPurchaseOrder({ supplier_id: supplier.id, notes, lines: payloadLines }, authToken())
      await loadOrders()
      resetNewPoForm()
      setActiveTab('PO')
      Swal.fire({ icon: 'success', title: 'Purchase order created', showConfirmButton: false, timer: 1500, timerProgressBar: true })
    } catch (err) {
      const body = (err as { body?: Record<string, unknown> })?.body
      const detail = body ? Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        : (err instanceof Error ? err.message : String(err))
      Swal.fire({ icon: 'error', title: 'Failed to create purchase order', text: detail })
    } finally {
      setCreating(false)
    }
  }

  const openReceive = (po: PurchaseOrder) => {
    setReceivingPo(po)
    setReceiveDate('')
    const qtyDefaults: Record<number, string> = {}
    const expiryDefaults: Record<number, string> = {}
    po.lines.forEach((line) => {
      qtyDefaults[line.id] = line.remaining > 0 ? String(line.remaining) : ''
      // Left blank rather than pre-filled from the PO-creation-time guess — a stale
      // value that happens to look "already filled in" invites submitting it unchanged,
      // which is exactly what silently fails once a later received date is picked.
      expiryDefaults[line.id] = ''
    })
    setReceiveQty(qtyDefaults)
    setReceiveExpiry(expiryDefaults)
  }

  const handleSubmitReceive = async () => {
    if (!receivingPo) return
    const payloadLines: ReceiveLineInput[] = []
    for (const line of receivingPo.lines) {
      const raw = receiveQty[line.id]
      const qty = Number(raw)
      if (raw && qty > 0) {
        payloadLines.push({ id: line.id, quantity_received: qty, expiry_date: receiveExpiry[line.id] || null })
      }
    }
    if (payloadLines.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Enter at least one received quantity' })
      return
    }
    const effectiveDate = receiveDate || todayIso()
    const badExpiry = payloadLines.find((l) => l.expiry_date && l.expiry_date < effectiveDate)
    if (badExpiry) {
      Swal.fire({ icon: 'warning', title: 'Expiry date is before the received date',
        text: 'Check the highlighted line — an item can\'t already be expired before it was received.' })
      return
    }
    setReceiving(true)
    try {
      const updated = await receivePurchaseOrder(receivingPo.id, payloadLines, receiveDate || undefined, authToken())
      setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setReceivingPo(null)
      Swal.fire({ icon: 'success', title: 'Receipt recorded', showConfirmButton: false, timer: 1500, timerProgressBar: true })
    } catch (err) {
      const body = (err as { body?: Record<string, unknown> })?.body
      const detail = body ? Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        : (err instanceof Error ? err.message : String(err))
      Swal.fire({ icon: 'error', title: 'Failed to record receipt', text: detail })
    } finally {
      setReceiving(false)
    }
  }

  const runAction = async (po: PurchaseOrder, action: (id: number, token?: string) => Promise<PurchaseOrder>, confirmMsg?: string) => {
    if (confirmMsg) {
      const result = await Swal.fire({ icon: 'question', title: confirmMsg, showCancelButton: true, confirmButtonText: 'Yes' })
      if (!result.isConfirmed) return
    }
    setBusyPoId(po.id)
    try {
      const updated = await action(po.id, authToken())
      setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      const body = (err as { body?: Record<string, unknown> })?.body
      const detail = body ? Object.entries(body).map(([k, v]) => `${k}: ${v}`).join('\n')
        : (err instanceof Error ? err.message : String(err))
      Swal.fire({ icon: 'error', title: 'Action failed', text: detail })
    } finally {
      setBusyPoId(null)
    }
  }

  const productOrders = purchaseOrders
    .flatMap((po) => po.lines.map((line) => ({ ...line, po })))
    .sort((a, b) => b.po.created_at.localeCompare(a.po.created_at))
  const toggleExpanded = (poId: number) => setExpandedPoId((prev) => (prev === poId ? null : poId))

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

          <div className="px-6 pt-3 flex-shrink-0 flex items-center justify-between gap-3">
            <div className="flex border-b border-neutral-200 flex-1">
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
            {activeTab === 'PO' && !showNewPo && (
              <button type="button" onClick={openNewPo}
                className="flex-shrink-0 mb-2 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                  text-white bg-brand-600 rounded-lg hover:bg-brand-800 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New PO
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading orders…</span>
              </div>
            ) : (
              <>
                {activeTab === 'Product Orders' && (
                  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50">
                          {['Product/Item', 'Quantity', 'Received', 'Unit Cost', 'Total', 'Order Date'].map((h) => (
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
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-800">{o.product_name}</td>
                            <td className="px-4 py-3 text-sm text-neutral-600 text-right">{o.quantity}</td>
                            <td className={`px-4 py-3 text-sm text-right ${o.received_quantity < o.quantity ? 'text-warning-600 font-semibold' : 'text-neutral-600'}`}>
                              {o.received_quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-600 text-right">{fmt(Number(o.unit_cost))}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-800 text-right">{fmt(o.total)}</td>
                            <td className="px-4 py-3 text-sm text-neutral-600 text-right">{o.po.created_at.slice(0, 10)}</td>
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
                  <div className="flex flex-col gap-3">
                    {receivingPo && (
                      <div className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-3 bg-neutral-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-500">
                            Receive delivery — {receivingPo.po_number}
                          </span>
                          <input type="date" value={receiveDate} onChange={(e) => setReceiveDate(e.target.value)}
                            title="Received date (defaults to today)"
                            className="px-2 py-1.5 text-xs border border-neutral-200 rounded-md
                              focus:outline-none focus:ring-2 focus:ring-brand-600" />
                        </div>
                        <p className="text-xs text-neutral-400">
                          Reduce a quantity if that item arrived short, or clear it to 0 if it didn&apos;t come at all.
                          Set the expiry to what&apos;s actually printed on the delivered batch.
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-[1fr_4.5rem_4.5rem_5.5rem_8rem] gap-2 px-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                            <span>Product</span>
                            <span className="text-right">Ordered</span>
                            <span className="text-right">Received</span>
                            <span className="text-right">Receiving now</span>
                            <span className="text-right">Expiry</span>
                          </div>
                          {(() => {
                            const effectiveDate = receiveDate || todayIso()
                            return receivingPo.lines.map((line) => {
                              const expiry = receiveExpiry[line.id]
                              const expiryInvalid = !!expiry && expiry < effectiveDate
                              return (
                                <div key={line.id} className="flex flex-col gap-1">
                                  <div className="grid grid-cols-[1fr_4.5rem_4.5rem_5.5rem_8rem] gap-2 items-center">
                                    <span className="text-sm font-medium text-neutral-700 truncate">{line.product_name}</span>
                                    <span className="text-sm text-neutral-500 text-right">{line.quantity}</span>
                                    <span className="text-sm text-neutral-500 text-right">{line.received_quantity}</span>
                                    <input type="text" inputMode="numeric" value={receiveQty[line.id] ?? ''}
                                      disabled={line.remaining <= 0}
                                      onChange={(e) => setReceiveQty((prev) => ({ ...prev, [line.id]: e.target.value.replace(/[^\d]/g, '') }))}
                                      placeholder="0"
                                      className="w-full px-2 py-1.5 text-sm text-right border border-neutral-200 rounded-md
                                        focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-neutral-100 disabled:text-neutral-400" />
                                    <input type="date" value={expiry ?? ''}
                                      disabled={line.remaining <= 0}
                                      onChange={(e) => setReceiveExpiry((prev) => ({ ...prev, [line.id]: e.target.value }))}
                                      title="Expiry date on the delivered batch (optional)"
                                      className={`w-full px-2 py-1.5 text-sm border rounded-md
                                        focus:outline-none focus:ring-2 disabled:bg-neutral-100 disabled:text-neutral-400
                                        ${expiryInvalid ? 'border-danger-400 focus:ring-danger-500' : 'border-neutral-200 focus:ring-brand-600'}`} />
                                  </div>
                                  {expiryInvalid && (
                                    <p className="text-[11px] text-danger-600 text-right">
                                      Expiry is before the received date ({effectiveDate}).
                                    </p>
                                  )}
                                </div>
                              )
                            })
                          })()}
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button type="button" onClick={() => setReceivingPo(null)} disabled={receiving}
                            className="px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 rounded-lg
                              hover:bg-neutral-200 transition-colors disabled:opacity-40">
                            Cancel
                          </button>
                          <button type="button" onClick={handleSubmitReceive} disabled={receiving}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-success-600
                              rounded-lg hover:opacity-90 transition-colors disabled:opacity-40">
                            {receiving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Confirm Receipt
                          </button>
                        </div>
                      </div>
                    )}

                    {showNewPo && (
                      <div className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-3 bg-neutral-50">
                        <span className="text-xs font-semibold text-neutral-500">New Purchase Order</span>
                        <div className="flex flex-col gap-2">
                          {lines.map((line, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <select value={line.product} onChange={(e) => updateLine(i, { product: e.target.value })}
                                className="flex-1 min-w-0 px-2 py-2 text-sm border border-neutral-200 rounded-md bg-white
                                  focus:outline-none focus:ring-2 focus:ring-brand-600">
                                <option value="">{productsLoading ? 'Loading products…' : 'Select product…'}</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.descshort} ({p.itemcode})</option>
                                ))}
                              </select>
                              <input type="text" inputMode="numeric" placeholder="Qty" value={line.quantity}
                                onChange={(e) => updateLine(i, { quantity: e.target.value.replace(/[^\d]/g, '') })}
                                className="w-20 px-2 py-2 text-sm text-right border border-neutral-200 rounded-md
                                  focus:outline-none focus:ring-2 focus:ring-brand-600" />
                              <input type="text" inputMode="decimal" placeholder="Unit Cost" value={line.unit_cost}
                                onChange={(e) => updateLine(i, { unit_cost: e.target.value.replace(/[^\d.]/g, '') })}
                                className="w-24 px-2 py-2 text-sm text-right border border-neutral-200 rounded-md
                                  focus:outline-none focus:ring-2 focus:ring-brand-600" />
                              <input type="date" value={line.expiry_date}
                                onChange={(e) => updateLine(i, { expiry_date: e.target.value })}
                                title="Expiry date (optional)"
                                className="w-36 px-2 py-2 text-sm border border-neutral-200 rounded-md
                                  focus:outline-none focus:ring-2 focus:ring-brand-600" />
                              <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md
                                  text-neutral-400 hover:text-danger-600 hover:bg-danger-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={addLine}
                            className="self-start flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                            <Plus className="w-3.5 h-3.5" /> Add line
                          </button>
                        </div>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md resize-none
                            focus:outline-none focus:ring-2 focus:ring-brand-600" />
                        <div className="flex items-center gap-2 justify-end">
                          <button type="button" onClick={resetNewPoForm} disabled={creating}
                            className="px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 rounded-lg
                              hover:bg-neutral-200 transition-colors disabled:opacity-40">
                            Cancel
                          </button>
                          <button type="button" onClick={handleCreate} disabled={creating}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600
                              rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40">
                            {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Create Purchase Order
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-100 bg-neutral-50">
                            {['PO Number', 'Date Created', 'Date Received', 'Status', 'Total Amount', ''].map((h, i) => (
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
                            const isBusy = busyPoId === po.id
                            return (
                              <Fragment key={po.id}>
                                <tr className="hover:bg-neutral-50 transition-colors">
                                  <td className="px-4 py-3 text-sm font-semibold text-neutral-800 font-mono cursor-pointer"
                                    onClick={() => toggleExpanded(po.id)}>
                                    <div className="flex items-center gap-1.5">
                                      {isExpanded
                                        ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />}
                                      {po.po_number}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-neutral-600 text-right">{po.created_at.slice(0, 10)}</td>
                                  <td className="px-4 py-3 text-sm text-neutral-600 text-right">
                                    {po.received_at ? po.received_at.slice(0, 10) : '—'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-center">
                                      <Badge variant={STATUS_VARIANT[po.status]}>{po.status_display}</Badge>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-neutral-800 text-right">{fmt(po.total_amount)}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />}
                                      {!isBusy && po.status === 'draft' && (
                                        <button type="button" onClick={() => runAction(po, sendPurchaseOrder)}
                                          className="px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                                          Send
                                        </button>
                                      )}
                                      {!isBusy && (po.status === 'sent' || po.status === 'partially_received') && (
                                        <button type="button" onClick={() => openReceive(po)}
                                          className="px-2 py-1 text-xs font-semibold text-success-600 hover:bg-success-50 rounded-md transition-colors">
                                          Receive
                                        </button>
                                      )}
                                      {!isBusy && po.status === 'partially_received' && (
                                        <button type="button"
                                          onClick={() => runAction(po, closePurchaseOrder,
                                            `Close ${po.po_number} as final? Quantities that never arrived will stay recorded as short.`)}
                                          className="px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors">
                                          Close
                                        </button>
                                      )}
                                      {!isBusy && (po.status === 'draft' || po.status === 'sent') && (
                                        <button type="button"
                                          onClick={() => runAction(po, cancelPurchaseOrder, `Cancel ${po.po_number}?`)}
                                          className="px-2 py-1 text-xs font-semibold text-danger-600 hover:bg-danger-50 rounded-md transition-colors">
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-3 bg-neutral-50">
                                      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="border-b border-neutral-100">
                                              {['Product/Item', 'Quantity', 'Received', 'Unit Cost', 'Total'].map((h, i) => (
                                                <th key={h}
                                                  className={`px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide
                                                    ${i === 0 ? 'text-left' : 'text-right'}`}>
                                                  {h}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-neutral-100">
                                            {po.lines.map((item) => (
                                              <tr key={item.id}>
                                                <td className="px-3 py-2 text-xs font-semibold text-neutral-700">{item.product_name}</td>
                                                <td className="px-3 py-2 text-xs text-neutral-600 text-right">{item.quantity}</td>
                                                <td className={`px-3 py-2 text-xs text-right ${item.received_quantity < item.quantity ? 'text-warning-600 font-semibold' : 'text-neutral-600'}`}>
                                                  {item.received_quantity}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-neutral-600 text-right">{fmt(Number(item.unit_cost))}</td>
                                                <td className="px-3 py-2 text-xs font-semibold text-neutral-700 text-right">{fmt(item.total)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                        {po.lines.length === 0 && (
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
                      {purchaseOrders.length === 0 && !showNewPo && (
                        <EmptyState
                          icon={<PackageSearch className="w-6 h-6 text-brand-600" />}
                          title="No purchase orders yet"
                          description="POs raised for this supplier will show up here"
                          action={{ label: 'Create the first one', onClick: openNewPo }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
