'use client'

import { useEffect, useState } from 'react'
import {
  Truck, CheckCircle2, ShieldCheck, Search, Pencil, Trash2, Plus,
  Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { getSuppliersPage, deleteSupplier, type Supplier } from '@/lib/api/suppliers/supplier'
import Badge         from '@/components/shared/Badge'
import EmptyState    from '@/components/shared/EmptyState'
import ConfirmModal  from '@/components/shared/ConfirmModal'
import SupplierDialog from '@/components/suppliers/SupplierDialog'
import SupplierOrdersDialog from '@/components/suppliers/SupplierOrdersDialog'

const PAGE_SIZE = 10
type StatusFilter = 'All' | 'Active' | 'Inactive'

function authToken() { return localStorage.getItem('xantara_pos_access') ?? undefined }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [count, setCount]         = useState(0)
  const [loading, setLoading]     = useState(true)

  // Stat cards reflect totals across ALL suppliers — independent of the table's
  // current search/filter/page, same as Inventory's stat cards.
  const [totalCount, setTotalCount]           = useState(0)
  const [activeCount, setActiveCount]         = useState(0)
  const [accreditedCount, setAccreditedCount] = useState(0)

  const [searchInput, setSearchInput]   = useState('')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage]                 = useState(1)

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isDialogOpen, setIsDialogOpen]       = useState(false)
  const [deleteTarget, setDeleteTarget]       = useState<Supplier | null>(null)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)

  const openEdit = (s: Supplier) => { setEditingSupplier(s); setIsDialogOpen(true) }
  const openAdd  = () => { setEditingSupplier(null); setIsDialogOpen(true) }
  const openView = (s: Supplier) => setViewingSupplier(s)

  // Debounce free-text search so it doesn't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const loadStats = () => {
    const token = authToken()
    Promise.all([
      getSuppliersPage({ page: 1 }, token),
      getSuppliersPage({ page: 1, is_active: true }, token),
      getSuppliersPage({ page: 1, is_accredited: true }, token),
    ]).then(([all, active, accredited]) => {
      setTotalCount(all.count)
      setActiveCount(active.count)
      setAccreditedCount(accredited.count)
    }).catch(() => {})
  }

  const loadSuppliers = () => {
    const token = authToken()
    const is_active = statusFilter === 'All' ? undefined : statusFilter === 'Active'
    getSuppliersPage({ search: search || undefined, is_active, page }, token)
      .then((data) => { setSuppliers(data.results); setCount(data.count) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(loadSuppliers, [search, statusFilter, page])
  useEffect(loadStats, [])

  const refresh = () => { loadSuppliers(); loadStats() }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const token = authToken()
    try {
      await deleteSupplier(deleteTarget.id, token)
      setDeleteTarget(null)
      refresh()
    } catch {
      setDeleteTarget(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Supplier</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your suppliers</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white
            text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Total Suppliers</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-brand-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800">{totalCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Active</span>
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-success-600">{activeCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Accredited</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800">{accreditedCount}</div>
        </div>
      </div>

      {/* ── Search + filters ── */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search suppliers or code…"
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600
              focus:border-transparent placeholder:text-neutral-400"
          />
        </div>
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
          {(['All', 'Active', 'Inactive'] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap
                ${statusFilter === s
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
                }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {['Supplier', 'Code', 'Type', 'Terms', 'Status', ''].map((h) => (
                <th key={h}
                  className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-neutral-50 transition-colors group cursor-pointer" onClick={() => openView(s)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-800">{s.company_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-neutral-400 font-mono">{s.supplier_code}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 capitalize">
                    {s.supplier_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600">{s.payment_terms}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(s)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(s)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-danger-50 text-neutral-400 hover:text-danger-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading suppliers…</span>
          </div>
        )}

        {!loading && suppliers.length === 0 && (
          <EmptyState
            icon={<Truck className="w-6 h-6 text-brand-600" />}
            title="No suppliers found"
            description="Try adjusting your search or filters, or add a new supplier"
            action={{ label: 'Clear filters', onClick: () => { setSearchInput(''); setStatusFilter('All') } }}
          />
        )}

        {!loading && count > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, count)}–
              {Math.min(page * PAGE_SIZE, count)} of {count} suppliers
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center
                  text-neutral-400 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
                    ${page === n ? 'bg-brand-600 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center
                  text-neutral-400 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Product Orders / PO view (row click) ── */}
      {viewingSupplier && (
        <SupplierOrdersDialog supplier={viewingSupplier} onClose={() => setViewingSupplier(null)} />
      )}

      {/* ── Add / Edit dialog ── */}
      {isDialogOpen && (
        <SupplierDialog
          key={editingSupplier?.id ?? 'new'}
          open={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setEditingSupplier(null) }}
          onCreated={() => refresh()}
          editingSupplier={editingSupplier}
          onUpdated={() => refresh()}
        />
      )}

      {/* ── Delete confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete supplier?"
        message={
          <>
            <span className="font-semibold text-neutral-600">{deleteTarget?.company_name}</span>
            {' '}will be deactivated (soft-deleted).
          </>
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
