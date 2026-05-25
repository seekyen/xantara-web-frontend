'use client'

// TODO: Replace MOCK_DATA with API call → GET /api/products
// All CRUD operations → POST/PATCH/DELETE /api/products

import { useState, useEffect } from 'react'
import {
  Package, AlertTriangle, XCircle, TrendingUp,
  Search, Pencil, Trash2, X, ChevronLeft, ChevronRight, Download, Plus,
} from 'lucide-react'
import { CATEGORIES, type Product, type StockStatus } from '@/lib/mock/products'
import { usePOS }       from '@/context/POSContext'
import Badge            from '@/components/shared/Badge'
import EmptyState       from '@/components/shared/EmptyState'
import ConfirmModal     from '@/components/shared/ConfirmModal'

const PAGE_SIZE = 10

const EMPTY_FORM = { name: '', sku: '', category: '', price: '', stock: '', maxStock: '' }
type FormState   = typeof EMPTY_FORM

function deriveStatus(stock: number): StockStatus {
  if (stock === 0)   return 'Out of Stock'
  if (stock <= 10)   return 'Low Stock'
  return 'In Stock'
}

export default function InventoryPage() {
  const { products, setProducts } = usePOS()

  // ── Filter / sort state ──
  const [searchQuery,       setSearchQuery]       = useState('')
  const [selectedCategory,  setSelectedCategory]  = useState('all')
  const [stockFilter,       setStockFilter]        = useState('All')
  const [sortBy,            setSortBy]             = useState('name-asc')

  // ── Pagination ──
  const [page, setPage] = useState(1)

  // ── Bulk select ──
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // ── Add / Edit modal ──
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form,           setForm]           = useState<FormState>(EMPTY_FORM)

  // ── Delete confirm ──
  const [deleteTarget,   setDeleteTarget]   = useState<Product | null>(null)

  // ── Alert banner ──
  const [showBanner, setShowBanner] = useState(true)

  // ── Derived stats ──
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length
  const outOfStock    = products.filter((p) => p.status === 'Out of Stock').length
  const totalValue    = products.reduce((s, p) => s + p.price * p.stock, 0)

  // ── Filter + sort ──
  const filtered = products
    .filter((p) =>
      searchQuery
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .filter((p) =>
      selectedCategory !== 'all'
        ? p.category.toLowerCase() === selectedCategory.toLowerCase()
        : true
    )
    .filter((p) => {
      if (stockFilter === 'In Stock')     return p.stock > 10
      if (stockFilter === 'Low Stock')    return p.stock > 0 && p.stock <= 10
      if (stockFilter === 'Out of Stock') return p.stock === 0
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc')   return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc')  return b.name.localeCompare(a.name)
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'price-low')  return a.price - b.price
      if (sortBy === 'stock-low')  return a.stock - b.stock
      return 0
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [searchQuery, selectedCategory, stockFilter, sortBy])

  // ── Selection ──
  const toggleSelect    = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map((p) => p.id))
  const bulkDelete      = () => {
    setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
    setSelectedIds([])
  }

  // ── Modal handlers ──
  const openAdd  = () => { setEditingProduct(null); setForm(EMPTY_FORM); setIsModalOpen(true) }
  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({ name: p.name, sku: p.sku, category: p.category,
              price: String(p.price), stock: String(p.stock), maxStock: String(p.maxStock) })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    const stockNum = Number(form.stock)
    const status   = deriveStatus(stockNum)
    if (editingProduct) {
      setProducts((prev) => prev.map((p) =>
        p.id === editingProduct.id
          ? { ...p, name: form.name, sku: form.sku, category: form.category,
              price: Number(form.price), stock: stockNum, maxStock: Number(form.maxStock), status }
          : p
      ))
    } else {
      const today = new Date().toISOString().split('T')[0]
      setProducts((prev) => [{
        id: String(Date.now()), name: form.name, sku: form.sku, category: form.category,
        price: Number(form.price), cost: 0, stock: stockNum,
        maxStock: Number(form.maxStock), status, sold: 0, createdAt: today,
      }, ...prev])
    }
    setIsModalOpen(false)
  }

  const openDelete    = (p: Product) => setDeleteTarget(p)
  const confirmDelete = () => {
    if (!deleteTarget) return
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Inventory</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your product stock</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold
            text-neutral-600 bg-white border border-neutral-200 rounded-xl
            hover:bg-neutral-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white
              text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* ── Low stock banner ── */}
      {showBanner && lowStockCount > 0 && (
        <div className="flex items-center gap-3 mx-6 mt-4 px-4 py-3
          bg-warning-50 border border-warning-600/20 border-l-4 border-l-warning-600 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0" />
          <p className="text-sm text-neutral-700 flex-1">
            <span className="font-semibold text-warning-600">{lowStockCount} products</span>
            {' '}are running low and need restocking soon.
          </p>
          <button onClick={() => setStockFilter('Low Stock')}
            className="text-xs font-semibold text-warning-600 hover:underline flex-shrink-0">
            View all
          </button>
          <button onClick={() => setShowBanner(false)} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Bulk actions ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 mx-6 mt-3 px-4 py-3 bg-brand-600 rounded-xl text-white">
          <span className="text-sm font-semibold">{selectedIds.length} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={bulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete selected
            </button>
            <button onClick={() => setSelectedIds([])}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-brand-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800">{products.length}</div>
          <div className="text-xs text-neutral-400 mt-1">across all categories</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-warning-600">{lowStockCount}</div>
          <div className="text-xs text-neutral-400 mt-1">below reorder point</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-danger-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-danger-600">{outOfStock}</div>
          <div className="text-xs text-neutral-400 mt-1">needs restocking now</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Total Value</span>
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800">₱{totalValue.toLocaleString()}</div>
          <div className="text-xs text-success-600 mt-1">current inventory value</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search products or SKU…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600
              focus:border-transparent placeholder:text-neutral-400"
          />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
            text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2">
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => (
            <button key={s} onClick={() => setStockFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors
                ${stockFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-400 whitespace-nowrap">Sort by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
              text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-high">Price: High–Low</option>
            <option value="price-low">Price: Low–High</option>
            <option value="stock-low">Stock: Low first</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="w-10 px-4 py-3">
                <input type="checkbox"
                  checked={selectedIds.length === paginated.length && paginated.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300 cursor-pointer"
                />
              </th>
              {['Product','SKU','Category','Price','Stock','Status','Value',''].map((h) => (
                <th key={h}
                  className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                    ${h === 'Price' || h === 'Value' ? 'text-right' : h === 'Stock' || h === 'Status' ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((product) => (
              <tr key={product.id} className="hover:bg-neutral-50 transition-colors group">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-4 h-4 rounded border-neutral-300 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-800">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-neutral-400 font-mono">{product.sku}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-neutral-800">
                    ₱{product.price.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`text-sm font-bold ${
                      product.stock === 0   ? 'text-danger-600'  :
                      product.stock <= 10   ? 'text-warning-600' : 'text-neutral-800'}`}>
                      {product.stock}
                    </span>
                    <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          product.stock === 0  ? 'bg-danger-600'  :
                          product.stock <= 10  ? 'bg-warning-600' : 'bg-success-600'}`}
                        style={{ width: `${Math.min((product.stock / product.maxStock) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Badge variant={
                      product.status === 'Out of Stock' ? 'danger'  :
                      product.status === 'Low Stock'    ? 'warning' : 'success'
                    }>{product.status}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-neutral-600">
                    ₱{(product.price * product.stock).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(product)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openDelete(product)}
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

        {paginated.length === 0 && (
          <EmptyState
            icon={<Package className="w-6 h-6 text-brand-600" />}
            title="No products found"
            description="Try adjusting your search or filters"
            action={{ label: 'Clear filters', onClick: () => { setSearchQuery(''); setSelectedCategory('all'); setStockFilter('All') } }}
          />
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} products
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

      {/* ── Add / Edit drawer ── */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-[480px] z-50 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-base font-bold text-neutral-800">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {([
                { key: 'name' as const,    label: 'Product Name *', placeholder: 'e.g. Air Force 1', type: 'text',   mono: false },
                { key: 'sku'  as const,    label: 'SKU Code *',     placeholder: 'e.g. AF1-WHT-42',  type: 'text',   mono: true  },
              ]).map(({ key, label, placeholder, type, mono }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600 ${mono ? 'font-mono' : ''}`}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    Category *
                  </label>
                  <select value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600">
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    Price (₱) *
                  </label>
                  <input type="number" placeholder="0" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    Current Stock *
                  </label>
                  <input type="number" placeholder="0" value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    Max Stock
                  </label>
                  <input type="number" placeholder="50" value={form.maxStock}
                    onChange={(e) => setForm((f) => ({ ...f, maxStock: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                <span className="text-xs text-neutral-400">Status preview:</span>
                <Badge variant={
                  Number(form.stock) === 0  ? 'danger'  :
                  Number(form.stock) <= 10  ? 'warning' : 'success'
                }>
                  {deriveStatus(Number(form.stock))}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-neutral-100">
              <button onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                disabled={!form.name || !form.sku || !form.price}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                  rounded-lg hover:bg-brand-800 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed">
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete product?"
        message={
          <>
            <span className="font-semibold text-neutral-600">{deleteTarget?.name}</span>
            {' '}will be permanently removed from inventory.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
