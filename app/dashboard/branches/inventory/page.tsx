'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package, AlertTriangle, XCircle, TrendingUp,
  Search, Pencil, Trash2, X, ChevronLeft, ChevronRight, Download, Plus, Loader2,
  Barcode as BarcodeIcon, Printer,
} from 'lucide-react'
import ReactBarcode from 'react-barcode'
import Swal                                     from 'sweetalert2'
import { CATEGORIES, getStatus, type Product } from '@/lib/mock/products'
import { createProduct, updateProduct, getAllProducts } from '@/lib/api/products'
import { getCategories, getSubCategories, type Category as CatOption, type SubCategory as SubCatOption } from '@/lib/api/categories'
import { usePOS }       from '@/context/POSContext'
import Badge            from '@/components/shared/Badge'
import EmptyState       from '@/components/shared/EmptyState'
import ConfirmModal     from '@/components/shared/ConfirmModal'

// ── Detail drawer helpers ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-700 break-all">
        {children !== '' && children !== null && children !== undefined && children !== 0
          ? children
          : <span className="text-neutral-300">—</span>}
      </dd>
    </div>
  )
}

function BoolTag({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded ${
      value ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-neutral-400'
    }`}>{value ? 'Yes' : 'No'}</span>
  )
}

function Rp({ value }: { value: number }) {
  return value ? <>₱{value.toLocaleString('en-PH')}</> : <span className="text-neutral-300">—</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1.5">
        {title}
      </h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
    </div>
  )
}

function ProductDetailDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const status = getStatus(product)
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[600px] max-w-full z-50 bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-800">{product.descshort || product.itemcode}</h2>
              <Badge variant={
                status === 'Out of Stock' ? 'danger' :
                status === 'Low Stock'    ? 'warning' : 'success'
              }>{status}</Badge>
              {product.is_on_promo && <Badge variant="success">On Promo</Badge>}
            </div>
            <p className="text-xs text-neutral-400 font-mono">{product.itemcode}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <Section title="Identification">
            <Field label="Item Code">{product.itemcode}</Field>
            <Field label="Item Code 2">{product.itemcode2}</Field>
            <Field label="Item Code 3">{product.itemcode3}</Field>
            <Field label="Item Code 3 Type">{product.itemcode3type}</Field>
            <Field label="Description (Short)">{product.descshort}</Field>
            <Field label="Description (Long)">{product.desclong}</Field>
            <Field label="Tag">{product.tag}</Field>
            <Field label="Query Text">{product.querytext}</Field>
          </Section>
          <Section title="Classification">
            <Field label="Department">{product.deptcode}</Field>
            <Field label="Class">{product.classcode}</Field>
            <Field label="Category">{product.categorycode}</Field>
            <Field label="Sub-Category">{product.subcategorycode}</Field>
            <Field label="Group">{product.group}</Field>
            <Field label="Size">{product.size}</Field>
            <Field label="Color">{product.color}</Field>
            <Field label="Style">{product.style}</Field>
            <Field label="Item Type">{product.item_type}</Field>
            <Field label="Form">{product.form}</Field>
          </Section>
          <Section title="Pricing">
            <Field label="Retail Price"><Rp value={product.sell_price_rp} /></Field>
            <Field label="Wholesale Price"><Rp value={product.sell_price_ws} /></Field>
            <Field label="Price 2"><Rp value={product.sell_price2} /></Field>
            <Field label="Price 3"><Rp value={product.sell_price3} /></Field>
            <Field label="Price 4"><Rp value={product.sell_price4} /></Field>
            <Field label="Price 5"><Rp value={product.sell_price5} /></Field>
            <Field label="UOM">{product.sell_uom}</Field>
            <Field label="Pack">{product.sell_pack}</Field>
            <Field label="Pack Conversion">{product.sell_packconv || null}</Field>
            <Field label="Last Price Date">{product.sell_lastdate}</Field>
            <Field label="Dimension">{product.sell_dimension}</Field>
            <Field label="Weight">{product.sell_weight}</Field>
          </Section>
          <Section title="Stock">
            <Field label="Stock (SA)">{product.stock_sa}</Field>
            <Field label="Stock (SR)">{product.stock_sr}</Field>
            <Field label="Total Stock">{product.total_stock}</Field>
            <Field label="Reorder Point">{product.stock_rop}</Field>
            <Field label="Stock Limit">{product.stock_limit || null}</Field>
            <Field label="On Order">{product.stock_onorder || null}</Field>
            <Field label="Reserved">{product.stock_reserved || null}</Field>
            <Field label="Book Stock (SA)">{product.stock_book_sa || null}</Field>
            <Field label="Book Stock (SR)">{product.stock_book_sr || null}</Field>
            <Field label="Beg. Balance (SA)">{product.beg_balance_sa || null}</Field>
            <Field label="Beg. Balance (SR)">{product.beg_balance_sr || null}</Field>
            <Field label="Beg. Cost"><Rp value={product.beg_cost} /></Field>
            <Field label="Track Inventory"><BoolTag value={product.trackinventory} /></Field>
            <Field label="Below ROP"><BoolTag value={product.is_below_rop} /></Field>
          </Section>
          <Section title="Cost">
            <Field label="Unit Cost"><Rp value={product.unitcost} /></Field>
            <Field label="Avg. Unit Cost"><Rp value={product.unitcostave} /></Field>
            <Field label="Acquisition Cost"><Rp value={product.acqcost} /></Field>
            <Field label="Markup (Retail)"><Rp value={product.markup_rp} /></Field>
            <Field label="Markup (Wholesale)"><Rp value={product.markup_ws} /></Field>
          </Section>
          <Section title="Promotion">
            <Field label="On Promo"><BoolTag value={product.is_on_promo} /></Field>
            <Field label="Promo Allowed"><BoolTag value={product.pro_allowed} /></Field>
            <Field label="Promo Price (Retail)"><Rp value={product.pro_priceret} /></Field>
            <Field label="Promo Price (Wholesale)"><Rp value={product.pro_pricewhl} /></Field>
            <Field label="Promo Cost"><Rp value={product.pro_cost} /></Field>
            <Field label="Date From">{product.pro_datefr}</Field>
            <Field label="Time From">{product.pro_timefr}</Field>
            <Field label="Date To">{product.pro_dateto}</Field>
            <Field label="Time To">{product.pro_timeto}</Field>
          </Section>
          <Section title="Supplier & Codes">
            <Field label="Supplier">{product.suppliercode}</Field>
            <Field label="Tax Code">{product.taxcode}</Field>
            <Field label="GL Code">{product.glcode}</Field>
            <Field label="Inv. Code">{product.invcode}</Field>
            <Field label="Price Type">{product.pricetype}</Field>
            <Field label="Barcode Type">{product.barcodetype}</Field>
          </Section>
          <Section title="Quantities & Misc">
            <Field label="Qty 1">{product.sell_quantity1 || null}</Field>
            <Field label="Qty 2">{product.sell_quantity2 || null}</Field>
            <Field label="Qty 3">{product.sell_quantity3 || null}</Field>
            <Field label="Qty 4">{product.sell_quantity4 || null}</Field>
            <Field label="Min. Wholesale Qty">{product.minwhlsaleqty || null}</Field>
            <Field label="Slow Factor">{product.slowfactor || null}</Field>
            <Field label="Fast Factor">{product.fastfactor || null}</Field>
            <Field label="Planer ID">{product.planerid}</Field>
            <Field label="Buyer ID">{product.buyerid}</Field>
            <Field label="Print To">{product.printto}</Field>
            <Field label="Info 1">{product.info1}</Field>
            <Field label="Info 2">{product.info2}</Field>
            <Field label="Picture File">{product.picturefile}</Field>
          </Section>
          <Section title="Flags">
            <Field label="Active"><BoolTag value={product.active} /></Field>
            <Field label="With Serial"><BoolTag value={product.withserial} /></Field>
            <Field label="Generic"><BoolTag value={product.generic} /></Field>
            <Field label="Measured"><BoolTag value={product.measured} /></Field>
            <Field label="With Alias"><BoolTag value={product.withalias} /></Field>
            <Field label="Expiry Date"><BoolTag value={product.expirydate} /></Field>
            <Field label="Lot Number"><BoolTag value={product.lotnumber} /></Field>
            <Field label="Auto Conversion"><BoolTag value={product.withautoconv} /></Field>
          </Section>
          <Section title="Audit">
            <Field label="Created By">{product.createdby}</Field>
            <Field label="Created Date">{product.createddate}</Field>
            <Field label="Updated By">{product.updatedby}</Field>
            <Field label="Updated Date">{product.updateddate}</Field>
          </Section>
        </div>
      </div>
    </>
  )
}

// ── Barcode modal ─────────────────────────────────────────────────────────────

function BarcodeModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const value = (product.itemcode2 || product.itemcode || '').trim()

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
                <ReactBarcode value={value} format="CODE128" width={1.5} height={64} fontSize={11} margin={4} />
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

// ── Form helpers ─────────────────────────────────────────────────────────────

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1.5">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function FText({ label, value, onChange, placeholder, mono, span2 }: {
  label: string; value: string | undefined; onChange: (v: string) => void
  placeholder?: string; mono?: boolean; span2?: boolean
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">{label}</label>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className={`w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}

function FNum({ label, value, onChange, placeholder }: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">{label}</label>
      <input type="number" value={value ?? ''} placeholder={placeholder ?? '0'}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </div>
  )
}

function FCheck({ label, value, onChange }: {
  label: string; value: boolean | undefined; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={value ?? false} onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-neutral-300 accent-brand-600" />
      <span className="text-sm text-neutral-600">{label}</span>
    </label>
  )
}

function FSelect({ label, value, onChange, options, placeholder, span2, disabled }: {
  label: string; value: string | undefined; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string; span2?: boolean; disabled?: boolean
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

type FormState = Partial<Product>

export default function BranchInventoryPage() {
  const { products, setProducts, productsLoading } = usePOS()

  const [searchQuery,       setSearchQuery]       = useState('')
  const [selectedCategory,  setSelectedCategory]  = useState('all')
  const [stockFilter,       setStockFilter]        = useState('All')
  const [sortBy,            setSortBy]             = useState('name-asc')
  const [page,              setPage]              = useState(1)
  const [selectedIds,       setSelectedIds]        = useState<number[]>([])
  const [isModalOpen,       setIsModalOpen]        = useState(false)
  const [editingProduct,    setEditingProduct]     = useState<Product | null>(null)
  const [form,              setForm]               = useState<FormState>({})
  const [isSaving,          setIsSaving]           = useState(false)
  const [selectedProduct,   setSelectedProduct]    = useState<Product | null>(null)
  const [barcodeProduct,    setBarcodeProduct]     = useState<Product | null>(null)
  const [deleteTarget,      setDeleteTarget]       = useState<Product | null>(null)
  const [showBanner,        setShowBanner]         = useState(true)

  // ── Category / Sub-category options ──
  const [catOptions,    setCatOptions]    = useState<CatOption[]>([])
  const [subCatOptions, setSubCatOptions] = useState<SubCatOption[]>([])

  useEffect(() => {
    const t = localStorage.getItem('xantara_pos_access') ?? undefined
    getCategories(t).then(setCatOptions).catch(() => {})
    getSubCategories(t).then(setSubCatOptions).catch(() => {})
  }, [])

  const lowStockCount = products.filter((p) => getStatus(p) === 'Low Stock').length
  const outOfStock    = products.filter((p) => p.total_stock === 0).length
  const totalValue    = products.reduce((s, p) => s + p.sell_price_rp * p.total_stock, 0)

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
        ? p.categorycode.toLowerCase() === selectedCategory.toLowerCase()
        : true
    )
    .filter((p) => {
      if (stockFilter !== 'All') return getStatus(p) === stockFilter
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc')   return a.descshort.localeCompare(b.descshort)
      if (sortBy === 'name-desc')  return b.descshort.localeCompare(a.descshort)
      if (sortBy === 'price-high') return b.sell_price_rp - a.sell_price_rp
      if (sortBy === 'price-low')  return a.sell_price_rp - b.sell_price_rp
      if (sortBy === 'stock-low')  return a.total_stock - b.total_stock
      return 0
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [searchQuery, selectedCategory, stockFilter, sortBy])

  const toggleSelect    = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map((p) => p.id))
  const bulkDelete      = () => {
    setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
    setSelectedIds([])
  }

  const openAdd  = () => { setEditingProduct(null); setForm({}); setIsModalOpen(true) }
  const openEdit = (p: Product) => { setEditingProduct(p); setForm(p); setIsModalOpen(true) }

  const handleSave = async () => {
    const token = localStorage.getItem('xantara_pos_access') ?? undefined
    const {
      id: _id, total_stock: _ts, is_below_rop: _br, is_on_promo: _promo,
      createdby: _cb, createddate: _cd, updatedby: _ub, updateddate: _ud,
      stock_book_sa: _bsa, stock_book_sr: _bsr,
      beg_balance_sa: _bbsa, beg_balance_sr: _bbsr, beg_cost: _bc,
      ...payload
    } = form
    setIsSaving(true)
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload, token)
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? updated : p))
      } else {
        const created = await createProduct(payload, token)
        setProducts((prev) => [created, ...prev])
      }
      setIsModalOpen(false)
      const fresh = await getAllProducts(token)
      setProducts(fresh)
      Swal.fire({
        icon:              'success',
        title:             editingProduct ? 'Product updated!' : 'Product added!',
        showConfirmButton: false,
        timer:             1800,
        timerProgressBar:  true,
      })
    } catch (err) {
      const body = (err as { body?: Record<string, unknown> })?.body
      const detail = body
        ? Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        : (err instanceof Error ? err.message : String(err))
      Swal.fire({ icon: 'error', title: 'Save failed', text: detail })
    } finally {
      setIsSaving(false)
    }
  }

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
          <h1 className="text-xl font-bold text-neutral-800">Branch Inventory</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage product stock across branches</p>
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
          {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
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
              const status = getStatus(product)
              const maxBar = product.stock_limit > 0 ? product.stock_limit : Math.max(product.total_stock, product.stock_rop * 3, 1)
              return (
                <tr
                  key={product.id ?? i}
                  className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
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
                      {product.categorycode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-neutral-800">
                      ₱{product.sell_price_rp.toLocaleString('en-PH')}
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
                      ₱{(product.sell_price_rp * product.total_stock).toLocaleString('en-PH')}
                    </span>
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      {(product.itemcode2 || product.itemcode) ? (
                        <button
                          onClick={() => setBarcodeProduct(product)}
                          className="opacity-80 hover:opacity-100 transition-opacity"
                          title="Click to print barcode"
                        >
                          <ReactBarcode
                            value={product.itemcode2 || product.itemcode}
                            format="CODE128"
                            width={1}
                            height={28}
                            fontSize={7}
                            margin={2}
                            displayValue
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
                      <button onClick={() => setDeleteTarget(product)}
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

      {/* ── Product detail drawer ── */}
      {selectedProduct && (
        <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* ── Barcode modal ── */}
      {barcodeProduct && (
        <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />
      )}

      {/* ── Add / Edit drawer ── */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-[640px] max-w-full z-50 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
              <h2 className="text-base font-bold text-neutral-800">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <EditSection title="Identification">
                <FText label="Description (Short) *" value={form.descshort} onChange={(v) => setForm((f) => ({ ...f, descshort: v }))} span2 />
                <FText label="Item Code *" value={form.itemcode} onChange={(v) => setForm((f) => ({ ...f, itemcode: v }))} mono />
                <FText label="Item Code 2" value={form.itemcode2} onChange={(v) => setForm((f) => ({ ...f, itemcode2: v }))} mono />
                <FText label="Item Code 3" value={form.itemcode3} onChange={(v) => setForm((f) => ({ ...f, itemcode3: v }))} mono />
                <FText label="Item Code 3 Type" value={form.itemcode3type} onChange={(v) => setForm((f) => ({ ...f, itemcode3type: v }))} />
                <FText label="Tag" value={form.tag} onChange={(v) => setForm((f) => ({ ...f, tag: v }))} />
                <FText label="Description (Long)" value={form.desclong} onChange={(v) => setForm((f) => ({ ...f, desclong: v }))} span2 />
                <FText label="Query Text" value={form.querytext} onChange={(v) => setForm((f) => ({ ...f, querytext: v }))} span2 />
              </EditSection>
              <EditSection title="Classification">
                <FText label="Department" value={form.deptcode} onChange={(v) => setForm((f) => ({ ...f, deptcode: v }))} />
                <FText label="Class" value={form.classcode} onChange={(v) => setForm((f) => ({ ...f, classcode: v }))} />
                <FSelect
                  label="Category"
                  value={form.categorycode}
                  onChange={(v) => setForm((f) => ({ ...f, categorycode: v, subcategorycode: '' }))}
                  options={catOptions.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))}
                  placeholder="Select category…"
                />
                <FSelect
                  label="Sub-Category"
                  value={form.subcategorycode}
                  onChange={(v) => setForm((f) => ({ ...f, subcategorycode: v }))}
                  options={subCatOptions
                    .filter((s) =>
                      form.categorycode ? s.category_code === form.categorycode : true
                    )
                    .map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))}
                  placeholder={form.categorycode ? 'Select sub-category…' : 'Select a category first'}
                  disabled={!form.categorycode}
                />
                <FText label="Group" value={form.group} onChange={(v) => setForm((f) => ({ ...f, group: v }))} />
                <FText label="Size" value={form.size} onChange={(v) => setForm((f) => ({ ...f, size: v }))} />
                <FText label="Color" value={form.color} onChange={(v) => setForm((f) => ({ ...f, color: v }))} />
                <FText label="Style" value={form.style} onChange={(v) => setForm((f) => ({ ...f, style: v }))} />
                <FText label="Item Type" value={form.item_type} onChange={(v) => setForm((f) => ({ ...f, item_type: v }))} />
                <FText label="Form" value={form.form} onChange={(v) => setForm((f) => ({ ...f, form: v }))} />
              </EditSection>
              <EditSection title="Pricing">
                <FNum label="Retail Price (₱) *" value={form.sell_price_rp} onChange={(v) => setForm((f) => ({ ...f, sell_price_rp: v ?? 0 }))} />
                <FNum label="Wholesale Price (₱)" value={form.sell_price_ws} onChange={(v) => setForm((f) => ({ ...f, sell_price_ws: v ?? 0 }))} />
                <FNum label="Price 2 (₱)" value={form.sell_price2} onChange={(v) => setForm((f) => ({ ...f, sell_price2: v ?? 0 }))} />
                <FNum label="Price 3 (₱)" value={form.sell_price3} onChange={(v) => setForm((f) => ({ ...f, sell_price3: v ?? 0 }))} />
                <FNum label="Price 4 (₱)" value={form.sell_price4} onChange={(v) => setForm((f) => ({ ...f, sell_price4: v ?? 0 }))} />
                <FNum label="Price 5 (₱)" value={form.sell_price5} onChange={(v) => setForm((f) => ({ ...f, sell_price5: v ?? 0 }))} />
                <FText label="UOM" value={form.sell_uom} onChange={(v) => setForm((f) => ({ ...f, sell_uom: v }))} />
                <FText label="Pack" value={form.sell_pack} onChange={(v) => setForm((f) => ({ ...f, sell_pack: v }))} />
                <FNum label="Pack Conversion" value={form.sell_packconv} onChange={(v) => setForm((f) => ({ ...f, sell_packconv: v ?? 0 }))} />
                <FText label="Last Price Date" value={form.sell_lastdate ?? ''} onChange={(v) => setForm((f) => ({ ...f, sell_lastdate: v || null }))} placeholder="YYYY-MM-DD" />
                <FText label="Dimension" value={form.sell_dimension} onChange={(v) => setForm((f) => ({ ...f, sell_dimension: v }))} />
                <FText label="Weight" value={form.sell_weight} onChange={(v) => setForm((f) => ({ ...f, sell_weight: v }))} />
              </EditSection>
              <EditSection title="Stock">
                <FNum label="Stock (SA)" value={form.stock_sa} onChange={(v) => setForm((f) => ({ ...f, stock_sa: v ?? 0 }))} />
                <FNum label="Reorder Point" value={form.stock_rop} onChange={(v) => setForm((f) => ({ ...f, stock_rop: v ?? 0 }))} />
                <FNum label="Stock Limit" value={form.stock_limit} onChange={(v) => setForm((f) => ({ ...f, stock_limit: v ?? 0 }))} />
                <FNum label="On Order" value={form.stock_onorder} onChange={(v) => setForm((f) => ({ ...f, stock_onorder: v ?? 0 }))} />
              </EditSection>
              <EditSection title="Cost">
                <FNum label="Unit Cost (₱)" value={form.unitcost} onChange={(v) => setForm((f) => ({ ...f, unitcost: v ?? 0 }))} />
                <FNum label="Avg. Unit Cost (₱)" value={form.unitcostave} onChange={(v) => setForm((f) => ({ ...f, unitcostave: v ?? 0 }))} />
                <FNum label="Acquisition Cost (₱)" value={form.acqcost} onChange={(v) => setForm((f) => ({ ...f, acqcost: v ?? 0 }))} />
                <FNum label="Markup (Retail) (₱)" value={form.markup_rp} onChange={(v) => setForm((f) => ({ ...f, markup_rp: v ?? 0 }))} />
                <FNum label="Markup (Wholesale) (₱)" value={form.markup_ws} onChange={(v) => setForm((f) => ({ ...f, markup_ws: v ?? 0 }))} />
              </EditSection>
              <EditSection title="Promotion">
                <FNum label="Promo Price (Retail) (₱)" value={form.pro_priceret} onChange={(v) => setForm((f) => ({ ...f, pro_priceret: v ?? 0 }))} />
                <FNum label="Promo Price (Wholesale) (₱)" value={form.pro_pricewhl} onChange={(v) => setForm((f) => ({ ...f, pro_pricewhl: v ?? 0 }))} />
                <FNum label="Promo Cost (₱)" value={form.pro_cost} onChange={(v) => setForm((f) => ({ ...f, pro_cost: v ?? 0 }))} />
                <div />
                <FText label="Date From" value={form.pro_datefr ?? ''} onChange={(v) => setForm((f) => ({ ...f, pro_datefr: v || null }))} placeholder="YYYY-MM-DD" />
                <FText label="Time From" value={form.pro_timefr} onChange={(v) => setForm((f) => ({ ...f, pro_timefr: v }))} placeholder="HH:MM:SS" />
                <FText label="Date To" value={form.pro_dateto ?? ''} onChange={(v) => setForm((f) => ({ ...f, pro_dateto: v || null }))} placeholder="YYYY-MM-DD" />
                <FText label="Time To" value={form.pro_timeto} onChange={(v) => setForm((f) => ({ ...f, pro_timeto: v }))} placeholder="HH:MM:SS" />
              </EditSection>
              <EditSection title="Supplier & Codes">
                <FText label="Supplier Code" value={form.suppliercode} onChange={(v) => setForm((f) => ({ ...f, suppliercode: v }))} />
                <FText label="Tax Code" value={form.taxcode} onChange={(v) => setForm((f) => ({ ...f, taxcode: v }))} />
                <FText label="GL Code" value={form.glcode} onChange={(v) => setForm((f) => ({ ...f, glcode: v }))} />
                <FText label="Inv. Code" value={form.invcode} onChange={(v) => setForm((f) => ({ ...f, invcode: v }))} />
                <FText label="Price Type" value={form.pricetype} onChange={(v) => setForm((f) => ({ ...f, pricetype: v }))} />
                <FText label="Barcode Type" value={form.barcodetype} onChange={(v) => setForm((f) => ({ ...f, barcodetype: v }))} />
              </EditSection>
              <EditSection title="Quantities & Misc">
                <FNum label="Qty 1" value={form.sell_quantity1} onChange={(v) => setForm((f) => ({ ...f, sell_quantity1: v ?? 0 }))} />
                <FNum label="Qty 2" value={form.sell_quantity2} onChange={(v) => setForm((f) => ({ ...f, sell_quantity2: v ?? 0 }))} />
                <FNum label="Qty 3" value={form.sell_quantity3} onChange={(v) => setForm((f) => ({ ...f, sell_quantity3: v ?? 0 }))} />
                <FNum label="Qty 4" value={form.sell_quantity4} onChange={(v) => setForm((f) => ({ ...f, sell_quantity4: v ?? 0 }))} />
                <FNum label="Min. Wholesale Qty" value={form.minwhlsaleqty} onChange={(v) => setForm((f) => ({ ...f, minwhlsaleqty: v ?? 0 }))} />
                <FNum label="Slow Factor" value={form.slowfactor} onChange={(v) => setForm((f) => ({ ...f, slowfactor: v ?? 0 }))} />
                <FNum label="Fast Factor" value={form.fastfactor} onChange={(v) => setForm((f) => ({ ...f, fastfactor: v ?? 0 }))} />
                <div />
                <FText label="Planer ID" value={form.planerid} onChange={(v) => setForm((f) => ({ ...f, planerid: v }))} />
                <FText label="Buyer ID" value={form.buyerid} onChange={(v) => setForm((f) => ({ ...f, buyerid: v }))} />
                <FText label="Print To" value={form.printto} onChange={(v) => setForm((f) => ({ ...f, printto: v }))} />
                <FText label="Picture File" value={form.picturefile} onChange={(v) => setForm((f) => ({ ...f, picturefile: v }))} />
                <FText label="Info 1" value={form.info1} onChange={(v) => setForm((f) => ({ ...f, info1: v }))} span2 />
                <FText label="Info 2" value={form.info2} onChange={(v) => setForm((f) => ({ ...f, info2: v }))} span2 />
              </EditSection>
              <EditSection title="Flags">
                <FCheck label="Active" value={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
                <FCheck label="Track Inventory" value={form.trackinventory} onChange={(v) => setForm((f) => ({ ...f, trackinventory: v }))} />
                <FCheck label="With Serial" value={form.withserial} onChange={(v) => setForm((f) => ({ ...f, withserial: v }))} />
                <FCheck label="Generic" value={form.generic} onChange={(v) => setForm((f) => ({ ...f, generic: v }))} />
                <FCheck label="Measured" value={form.measured} onChange={(v) => setForm((f) => ({ ...f, measured: v }))} />
                <FCheck label="With Alias" value={form.withalias} onChange={(v) => setForm((f) => ({ ...f, withalias: v }))} />
                <FCheck label="Expiry Date" value={form.expirydate} onChange={(v) => setForm((f) => ({ ...f, expirydate: v }))} />
                <FCheck label="Lot Number" value={form.lotnumber} onChange={(v) => setForm((f) => ({ ...f, lotnumber: v }))} />
                <FCheck label="Auto Conversion" value={form.withautoconv} onChange={(v) => setForm((f) => ({ ...f, withautoconv: v }))} />
                <FCheck label="Promo Allowed" value={form.pro_allowed} onChange={(v) => setForm((f) => ({ ...f, pro_allowed: v }))} />
              </EditSection>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-neutral-100 flex-shrink-0">
              <button onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                disabled={isSaving || !form.descshort || !form.itemcode}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                  rounded-lg hover:bg-brand-800 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
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
