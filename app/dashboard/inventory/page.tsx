'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package, AlertTriangle, XCircle, TrendingUp,
  Search, Pencil, Trash2, X, ChevronLeft, ChevronRight, Download, Plus, Loader2,
  Barcode as BarcodeIcon, Printer,
} from 'lucide-react'
import { getStatus, type Product } from '@/lib/mock/products'
import BarcodePreview from '@/components/shared/BarcodePreview'
import { getStoredBarcodeFormat } from '@/lib/barcodeFormat'
import { getCategories, type Category as CatOption } from '@/lib/api/settings/category'
import { usePOS }       from '@/context/POSContext'
import Badge            from '@/components/shared/Badge'
import EmptyState       from '@/components/shared/EmptyState'
import ConfirmModal     from '@/components/shared/ConfirmModal'
import ProductDialog    from '@/components/inventory/ProductDialog'

// ── Barcode modal ─────────────────────────────────────────────────────────────

function BarcodeModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const value = (product.itemcode || '').trim()
  // Default format comes from Settings > General > Barcode & QR Setup.
  const [barcodeFormat] = useState(() => getStoredBarcodeFormat())

  const handlePrint = () => {
    if (!ref.current) return
    const w = window.open('', '_blank', 'width=420,height=320')
    if (!w) return
    w.document.write(`
      <html>
        <head><title>Barcode – ${product.itemcode}</title></head>
        <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;text-align:center;margin:0">
          <div>
            <p style="font-size:13px;font-weight:600;margin:0 0 8px">${product.descshort}</p>
            ${ref.current.innerHTML}
            <p style="font-size:11px;color:#888;margin:4px 0 0;font-family:monospace">${product.itemcode}</p>
          </div>
        </body>
      </html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-80 flex flex-col items-center gap-4 p-6 pointer-events-auto">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-bold text-neutral-800">Barcode</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
          <div className="text-center w-full">
            <p className="text-xs font-semibold text-neutral-700 mb-3 truncate">{product.descshort}</p>
            {value ? (
              <div ref={ref} className="flex justify-center">
                <BarcodePreview value={value} format={barcodeFormat} height={64} />
              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-6">No barcode value available.</p>
            )}
            <p className="text-[10px] text-neutral-400 font-mono mt-1">{product.itemcode}</p>
          </div>
          <button onClick={handlePrint} disabled={!value}
            className="w-full py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg
              hover:bg-brand-800 transition-colors flex items-center justify-center gap-2
              disabled:opacity-40 disabled:cursor-not-allowed">
            <Printer className="w-4 h-4" />
            Print Barcode
          </button>
        </div>
      </div>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function InventoryPage() {
  const { products, setProducts, productsLoading } = usePOS()

  // ── Filter / sort state ──
  const [searchQuery,       setSearchQuery]       = useState('')
  const [selectedCategory,  setSelectedCategory]  = useState('all')
  const [stockFilter,       setStockFilter]        = useState('All')
  const [sortBy,            setSortBy]             = useState('name-asc')

  // ── Pagination ──
  const [page, setPage] = useState(1)

  // ── Bulk select ──
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // ── Add / Edit modal ──
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // ── Add / Edit / View Product dialog ──
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)

  // Default barcode format comes from Settings > General > Barcode & QR Setup.
  const [barcodeFormat] = useState(() => getStoredBarcodeFormat())

  // ── Barcode modal ──
  const [barcodeProduct,   setBarcodeProduct]   = useState<Product | null>(null)

  // ── Delete confirm ──
  const [deleteTarget,   setDeleteTarget]   = useState<Product | null>(null)

  // ── Alert banner ──
  const [showBanner, setShowBanner] = useState(true)

  // ── Category options (for the table's Category column + filter) ──
  const [catOptions, setCatOptions] = useState<CatOption[]>([])

  useEffect(() => {
    const t = localStorage.getItem('xantara_pos_access') ?? undefined
    getCategories(t).then(setCatOptions).catch(() => {})
  }, [])

  // ── Derived stats ──
  const lowStockCount = products.filter((p) => getStatus(p) === 'Low Stock').length
  const outOfStock    = products.filter((p) => p.total_stock === 0).length
  const totalValue    = products.reduce((s, p) => s + (Number(p.sell_price_rp) || 0) * (Number(p.total_stock) || 0), 0)

  // ── Filter + sort ──
  const filtered = products
    .filter((p) =>
      searchQuery
        ? p.descshort.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.itemcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.itemcode2.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.desclong.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .filter((p) =>
      selectedCategory !== 'all'
        ? p.categorycode === selectedCategory
        : true
    )
    .filter((p) => {
      if (stockFilter !== 'All') return getStatus(p) === stockFilter
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc')   return a.descshort.localeCompare(b.descshort)
      if (sortBy === 'name-desc')  return b.descshort.localeCompare(a.descshort)
      if (sortBy === 'price-high') return Number(b.sell_price_rp) - Number(a.sell_price_rp)
      if (sortBy === 'price-low')  return Number(a.sell_price_rp) - Number(b.sell_price_rp)
      if (sortBy === 'stock-low')  return Number(a.total_stock)   - Number(b.total_stock)
      return 0
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [searchQuery, selectedCategory, stockFilter, sortBy])

  // ── Selection ──
  const toggleSelect    = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map((p) => p.id))
  const bulkDelete      = () => {
    setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
    setSelectedIds([])
  }

  // ── Modal handlers ──
  // Add and Edit both open the new tabbed UI (ProductDialog) now.
  const openEdit = (p: Product) => { setEditingProduct(p); setIsProductDialogOpen(true) }

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
            onClick={() => { setEditingProduct(null); setIsProductDialogOpen(true) }}
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
          <div className="text-2xl font-bold text-neutral-800">₱{totalValue.toLocaleString('en-PH')}</div>
          <div className="text-xs text-success-600 mt-1">current inventory value</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search products or item code…"
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
          {catOptions.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
          {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((s) => (
            <button key={s} onClick={() => setStockFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap
                ${stockFilter === s
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
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
              {['Product','SKU','Category','Price','Stock','Status','Value','Barcode',''].map((h, i) => (
                <th key={h || i}
                  className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                    ${h === 'Price' || h === 'Value' ? 'text-right' : h === 'Stock' || h === 'Status' || h === 'Barcode' ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((product, i) => {
              const status  = getStatus(product)
              const maxBar  = product.stock_limit > 0 ? product.stock_limit : Math.max(product.total_stock, product.stock_rop * 3, 1)
              return (
                <tr
                  key={product.id ?? i}
                  className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                  onClick={() => openEdit(product)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                      <span className="text-sm font-semibold text-neutral-800">{product.descshort}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-neutral-400 font-mono">{product.itemcode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600">
                      {catOptions.find((c) => c.code === product.categorycode)?.name ?? product.categorycode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-neutral-800">
                      ₱{(Number(product.sell_price_rp) || 0).toLocaleString('en-PH')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={`text-sm font-bold ${
                        status === 'Out of Stock' ? 'text-danger-600' :
                        status === 'Low Stock'    ? 'text-warning-600' : 'text-neutral-800'}`}>
                        {product.total_stock}
                      </span>
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === 'Out of Stock' ? 'bg-danger-600' :
                            status === 'Low Stock'    ? 'bg-warning-600' : 'bg-success-600'}`}
                          style={{ width: `${Math.min((product.total_stock / maxBar) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Badge variant={
                        status === 'Out of Stock' ? 'danger'  :
                        status === 'Low Stock'    ? 'warning' : 'success'
                      }>{status}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-neutral-600">
                      ₱{((Number(product.sell_price_rp) || 0) * (Number(product.total_stock) || 0)).toLocaleString('en-PH')}
                    </span>
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      {product.itemcode ? (
                        <button
                          onClick={() => setBarcodeProduct(product)}
                          className="opacity-80 hover:opacity-100 transition-opacity"
                          title="Click to print barcode"
                        >
                          <BarcodePreview
                            value={product.itemcode}
                            format={barcodeFormat}
                            height={28}
                          />
                        </button>
                      ) : (
                        <span className="text-neutral-300 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
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
              )
            })}
          </tbody>
        </table>

        {productsLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading products…</span>
          </div>
        )}

        {!productsLoading && paginated.length === 0 && (
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

      {/* ── Barcode modal ── */}
      {barcodeProduct && (
        <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />
      )}

      {/* ── Add / Edit / View dialog ── */}
      {isProductDialogOpen && (
        <ProductDialog
          key={editingProduct?.id ?? 'new'}
          open={isProductDialogOpen}
          onClose={() => { setIsProductDialogOpen(false); setEditingProduct(null) }}
          onCreated={(created) => setProducts((prev) => [created, ...prev])}
          editingProduct={editingProduct}
          onUpdated={(updated) => setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
        />
      )}

      {/* ── Delete confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete product?"
        message={
          <>
            <span className="font-semibold text-neutral-600">{deleteTarget?.descshort}</span>
            {' '}will be permanently removed from inventory.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
