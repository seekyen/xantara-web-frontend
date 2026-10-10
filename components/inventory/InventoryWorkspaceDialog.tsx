'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Swal from 'sweetalert2'
import { X, Plus, Trash2, Loader2, Package, History, ImageUp, Pencil, ChevronDown, Search, Archive } from 'lucide-react'
import { StockBalances, ReceiptFields, freshReceipt, receiptPayload, type StockSummary } from './StockOperationsDialog'
import schema from '@/lib/inventory-schema.json'
import { apiBlob, apiFetch, ApiError } from '@/lib/api/client'
import { getProduct, updateProduct } from '@/lib/api/products'
import { type Product } from '@/lib/mock/products'
import { getCategories, createCategory } from '@/lib/api/settings/category'
import { getUnits, createUnit } from '@/lib/api/settings/unit'
import { getAllSuppliers } from '@/lib/api/suppliers/supplier'
import SupplierDialog from '@/components/suppliers/SupplierDialog'
import AddEntityModal from '@/components/shared/AddEntityModal'

type Values = Record<string, unknown>
type Field = { key: string; label: string; type: string; tier?: number; section?: string; required?: boolean; default?: unknown; options?: string[]; fields?: Field[]; hint?: string; maxLength?: number; positive?: boolean; max?: number }
type Document = { id?: number; branch: string; tier: string; revision: number; data: Values; margin_percent?: string; stock?: StockSummary; last_purchase_supplier?: string | null }
type Revision = { revision: number; date: string; actor: string; branch: string; reason: string; before: Document; after: Document }
const fields = schema.fields as Field[]
const inputClass = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100'
const token = () => localStorage.getItem('xantara_pos_access') ?? undefined
const fresh = (): Document => ({ branch: 'MAIN', tier: 'basic', revision: 0, data: Object.fromEntries(fields.filter(f => f.default !== undefined).map(f => [f.key, f.default])) })
// Lightest → darkest, matching the sections' display order (Product Definition first).
const SECTION_SHADES: Record<string, string> = {
  'Product Definition':        'bg-blue-50 text-blue-900',
  'Classification':            'bg-blue-100 text-blue-900',
  'Inventory Control':         'bg-blue-200 text-blue-900',
  'Purchasing & Suppliers':    'bg-blue-300 text-blue-950',
  'Pricing & Promotions':      'bg-blue-400 text-white',
}

const STANDARD_UNITS = ['pc', 'bottle', 'can', 'sachet', 'pack', 'kg', 'g', 'L', 'mL', 'meter']

function InventoryField({ field, value, onChange, disabled = false, onAddNew }: { field: Field; value: unknown; onChange: (value: unknown) => void; disabled?: boolean; onAddNew?: () => void }) {
  if (field.type === 'rows') {
    const rows = (Array.isArray(value) ? value : []) as Values[]
    // Block a new blank row until the previous one's first field is actually filled in —
    // otherwise rows pile up empty and nothing distinguishes them from each other.
    const firstFieldKey = field.fields?.[0]?.key
    const lastRow = rows[rows.length - 1]
    const lastRowIncomplete = rows.length > 0 && firstFieldKey
      ? lastRow[firstFieldKey] === undefined || lastRow[firstFieldKey] === null || lastRow[firstFieldKey] === ''
      : false
    const addDisabled = disabled || lastRowIncomplete
    return <div className="col-span-full rounded-xl border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-sm">{field.label}</h4><button type="button" disabled={addDisabled} onClick={() => onChange([...rows, {}])} title={lastRowIncomplete ? `Fill in ${field.fields?.[0]?.label ?? 'the first field'} on the row above before adding another.` : undefined} className="flex items-center gap-1 text-sm text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"><Plus size={16}/> Add row</button></div>
      {field.hint && <p className="text-xs text-neutral-500">{field.hint}</p>}
      {lastRowIncomplete && <p className="text-xs text-warning-600">Fill in {field.fields?.[0]?.label ?? 'the first field'} on the last row before adding another.</p>}
      {rows.length === 0 && <p className="text-sm text-neutral-400">No records added.</p>}
      {rows.map((row, index) => <div key={index} className="rounded-lg bg-neutral-50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field.fields?.map(child => {
          return <InventoryField key={child.key} field={child} value={row[child.key]} disabled={disabled} onChange={next => onChange(rows.map((r, i) => i === index ? { ...r, [child.key]: next } : r))}/>
        })}
        <button type="button" aria-label={`Remove ${field.label} row ${index + 1}`} disabled={disabled} onClick={() => onChange(rows.filter((_, i) => i !== index))} className="text-red-600 flex gap-1 items-center text-xs"><Trash2 size={14}/> Remove row</button>
      </div>)}
    </div>
  }
  if (field.type === 'boolean') return <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={e => onChange(e.target.checked)}/>{field.label}</label>
  const numeric = ['money', 'integer', 'decimal'].includes(field.type)
  return <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">{field.label}{field.required ? ' *' : ''}</span>
    {field.type === 'select' ? <div className="flex gap-2 items-center">
        <select className={inputClass + ' flex-1'} value={String(value ?? field.default ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled}><option value="">Choose…</option>{field.options?.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select>
        {onAddNew && <button type="button" onClick={onAddNew} disabled={disabled} className="flex-shrink-0 text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none">+ Add</button>}
      </div>
      : <input className={inputClass} type={numeric ? 'number' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'} value={String(value ?? '')} required={field.required} maxLength={field.maxLength} min={numeric ? field.positive ? 0.000001 : 0 : undefined} max={field.max} step={field.type === 'integer' ? 1 : field.type === 'money' ? '0.01' : 'any'} disabled={disabled} onChange={e => onChange(field.type === 'integer' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}/>}
    {field.hint && <span className="block text-xs text-neutral-500">{field.hint}</span>}
  </label>
}

type LookupResult = { match: 'barcode' | 'name'; barcode: string; name: string; brand: string; quantity: string; description?: string; source: string; source_url: string; image_url: string; thumb_url: string }
type LookupResponse = { matched_by: 'barcode' | 'name' | null; results: LookupResult[]; unavailable: string[] }

// Suggests images/barcodes from the open product databases (food, beauty, general, pet).
// Nothing is applied until the admin picks a card, and the barcode is never guessed.
function ProductLookup({ name, barcode, disabled, onUseImage, onUseBarcode }: {
  name: string; barcode: string; disabled: boolean; onUseImage: (file: File) => void
  // Applies the barcode and returns what else it filled in (SKU, description) for the notice.
  onUseBarcode: (result: LookupResult) => { applied: string[]; note?: string }
}) {
  const [online, setOnline] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [data, setData] = useState<LookupResponse | null>(null)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  const code = barcode.trim()
  const validCode = /^\d{6,14}$/.test(code)
  const canSearch = (validCode || name.trim().length >= 2) && online && !disabled
  async function search() {
    setBusy(true); setError(''); setNotice(''); setData(null)
    try {
      const params = new URLSearchParams()
      if (validCode) params.set('barcode', code)
      if (name.trim().length >= 2) params.set('name', name.trim())
      setData(await apiFetch<LookupResponse>(`/api/v1/inventory-items/lookup/?${params}`, {}, token()))
    } catch (err) {
      setError(err instanceof ApiError && err.body && typeof err.body === 'object' && Object.keys(err.body).length ? Object.values(err.body).flat().join(' ') : 'Online lookup failed. Please retry.')
    } finally { setBusy(false) }
  }
  async function downloadImage(result: LookupResult) {
    try {
      const blob = await apiBlob(`/api/v1/inventory-items/lookup-image/?url=${encodeURIComponent(result.image_url)}`, token())
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      onUseImage(new File([blob], `${result.barcode}.${ext}`, { type: blob.type }))
      return true
    } catch { setError('The picture could not be downloaded. Try another suggestion or attach one manually.'); return false }
  }
  async function choose(result: LookupResult, image: boolean, useCode: boolean) {
    setBusy(true); setError(''); setNotice('')
    const done: string[] = []
    try {
      if (image && result.image_url) { if (!(await downloadImage(result))) return; done.push('image') }
      let note = ''
      if (useCode) { const extra = onUseBarcode(result); done.push('barcode', ...extra.applied); note = extra.note ? ` ${extra.note}` : '' }
      setNotice(`Applied ${done.length > 2 ? `${done.slice(0, -1).join(', ')} and ${done[done.length - 1]}` : done.join(' and ')} from ${result.name}.${note} Save the product to keep ${done.length > 1 ? 'them' : 'it'}.`)
    } finally { setBusy(false) }
  }
  const smallButton = 'rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:border-blue-600 disabled:opacity-50'
  return <div className="space-y-3">
    <button type="button" disabled={!canSearch || busy} onClick={search} title={!online ? 'Connect to the internet to look up products.' : undefined}
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
      <Search size={16}/>{busy ? 'Working…' : 'Look up online'}
    </button>
    {!online && <p className="text-xs text-neutral-500">Offline — connect to the internet to look up an image and barcode.</p>}
    {online && !canSearch && !disabled && <p className="text-xs text-neutral-500">Enter a product name (or a barcode) first.</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {notice && <p role="status" className="text-xs text-emerald-700">{notice}</p>}
    {data && <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
      <p className="text-xs text-neutral-600">{data.results.length === 0
        ? 'No matching products found online. Check the name or attach an image manually.'
        : 'Suggestions come from open, user-contributed databases and can be wrong or incomplete. Check the name, size and variant before using a barcode.'}</p>
      {data.results.map(result => <div key={result.barcode} className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-50 p-2">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white">
          {result.thumb_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={result.thumb_url} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer"/>
            : <ImageUp className="h-5 w-5 text-neutral-300"/>}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex items-center gap-2 font-semibold text-neutral-900"><span className="truncate">{result.name}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.match === 'barcode' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>{result.match === 'barcode' ? 'Barcode match' : 'Name match'}</span></p>
          <p className="truncate text-xs text-neutral-600">{[result.brand, result.quantity].filter(Boolean).join(' · ') || 'No brand or size listed'}</p>
          <p className="text-xs text-neutral-500">Barcode {result.barcode} · <a href={result.source_url} target="_blank" rel="noopener noreferrer" className="underline">{result.source}</a></p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.image_url && <button type="button" disabled={busy} onClick={() => choose(result, true, false)} className={smallButton}>Use image</button>}
          <button type="button" disabled={busy} onClick={() => choose(result, false, true)} className={smallButton}>Use barcode</button>
          {result.image_url && <button type="button" disabled={busy} onClick={() => choose(result, true, true)} className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">Use both</button>}
        </div>
      </div>)}
      {data.unavailable.length > 0 && <p className="text-xs text-amber-700">Could not reach: {data.unavailable.join(', ')}. Results may be incomplete; try again later.</p>}
      <p className="text-[11px] text-neutral-500">Data from Open Food Facts, Open Beauty Facts, Open Products Facts and Open Pet Food Facts (open databases; images CC BY-SA, contributed by their communities).</p>
    </div>}
  </div>
}

// Attaches an actual image file to the real Product record (uploaded via the existing
// products endpoint's multipart PATCH), rather than typing an external URL — `value`
// still shows whatever's already attached (or a manually-typed legacy URL, as a fallback).
function ImageAttachmentField({ label, value, previewUrl, disabled, onPick }: {
  label: string; value: unknown; previewUrl: string; disabled: boolean; onPick: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const raw = previewUrl || (typeof value === 'string' ? value : '')
  // A relative media path (e.g. "/media/products/x.jpg") resolves against the API's
  // origin, not this Next.js app's — only object-URL/absolute previews skip the prefix.
  const shown = raw && !raw.startsWith('http') && !raw.startsWith('blob:')
    ? `${process.env.NEXT_PUBLIC_API_URL ?? ''}${raw}` : raw
  return <label className="block space-y-1.5 text-sm">
    <span className="font-medium text-neutral-700">{label}</span>
    <div className="relative w-[125px] h-[125px]">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={disabled}
        onChange={e => { const file = e.target.files?.[0]; if (file) onPick(file) }}/>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}
        className="w-full h-full border border-dashed border-neutral-300 rounded-lg bg-neutral-50
          hover:bg-neutral-100 hover:border-blue-600 transition-colors disabled:opacity-50
          flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-blue-700 overflow-hidden">
        {shown
          ? <img src={shown} alt={label} className="w-full h-full object-cover rounded" />
          : <><ImageUp className="w-5 h-5" /><span className="text-xs font-semibold">Attach image</span></>}
      </button>
      {shown && !disabled && (
        <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full
          bg-blue-700 text-white flex items-center justify-center shadow">
          <Pencil className="w-3 h-3" />
        </span>
      )}
    </div>
  </label>
}

export default function InventoryWorkspaceDialog({ open, onClose, editingProduct, onCreated, onUpdated, onArchived, onManageStock }: { onManageStock?: () => void; onArchived?: () => void; open: boolean; onClose: () => void; editingProduct?: Pick<Product, 'id'> | null; onCreated?: (product: Product) => void; onUpdated?: (product: Product) => void }) {
  const [opening, setOpening] = useState(false)
  const [receipt, setReceipt] = useState(freshReceipt)
  const [doc, setDoc] = useState<Document>(fresh)
  const [expectedQuantity, setExpectedQuantity] = useState(0)
  const branch = 'MAIN'
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(Boolean(editingProduct))
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Revision[] | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loadedBranch, setLoadedBranch] = useState('')
  const [retry, setRetry] = useState(0)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [unitOptions, setUnitOptions] = useState<string[]>([])
  const [supplierOptions, setSupplierOptions] = useState<string[]>([])
  // Barcode auto-fills from SKU as you type until you edit Barcode yourself — after
  // that it's independent, so a deliberate override never gets silently clobbered.
  const [barcodeTouched, setBarcodeTouched] = useState(false)
  // Sections start collapsed; expanding one is purely a display preference, not tied to tier.
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['Product Definition']))
  const toggleSection = (section: string) => setOpenSections(prev => {
    const next = new Set(prev)
    if (next.has(section)) next.delete(section); else next.add(section)
    return next
  })
  // Shortcut "+ Add" modals for the Category/Unit dropdowns — lets you add a missing
  // lookup entry without leaving this dialog. Supplier gets the real Suppliers module's
  // own dialog instead (below), since a supplier needs more than just a name.
  const [addTarget, setAddTarget] = useState<'category' | 'unit' | null>(null)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  // Newly-picked file for the Product image, staged until save() attaches it to the
  // real Product record — separate from doc.data.image_url, which only ever holds
  // whatever's already attached (or a legacy manually-typed external URL).
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  useEffect(() => () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl) }, [imagePreviewUrl])

  useEffect(() => {
    if (!editingProduct || !branch) return
    let active = true
    apiFetch<Document>(`/api/v1/inventory-items/${editingProduct.id}/?branch=${encodeURIComponent(branch)}`, {}, token())
      .then(result => { if (active) { setDoc(result); setError(''); setLoadedBranch(branch); setExpectedQuantity(Number(result.data.quantity)); setDirty(false) } })
      .catch(err => { if (active) setError(err instanceof ApiError ? `Could not load inventory (HTTP ${err.status}). Please retry; if this continues, check the backend logs and database migrations.` : 'Could not reach the inventory service. Check your connection and retry.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editingProduct, branch, retry])

  useEffect(() => {
    if (!open) return
    getCategories(token()).then(list => setCategoryOptions(list.filter(c => c.is_active).map(c => c.name))).catch(() => {})
    getUnits(token()).then(list => setUnitOptions(list.filter(u => u.is_active).map(u => u.name))).catch(() => {})
    getAllSuppliers(token()).then(list => { const active = list.filter(s => s.is_active); setSupplierOptions(active.map(s => s.company_name)) }).catch(() => {})
  }, [open])

  if (!open) return null
  const tierIndex = schema.tiers.findIndex(tier => tier.key === doc.tier)
  const operational = ['quantity', 'last_restocked', 'expiry_date', 'batches']
  const visible = fields.filter(field => (field.tier ?? 0) <= tierIndex && !operational.includes(field.key))
  const sections = [...new Set(visible.map(field => field.section).filter((s): s is string => Boolean(s)))]
  const price = Number(doc.data.selling_price || 0)
  const landed = Number(doc.data.cost_price || 0) + ((doc.data.landed_costs ?? []) as Values[]).reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const margin = price ? ((price - landed) / price * 100).toFixed(1) + '%' : '—'

  // Archiving hides the product but keeps its stock movements and history; the server refuses it while stock remains.
  async function archive() {
    if (!editingProduct) return
    const { isConfirmed } = await Swal.fire({ icon: 'warning', title: 'Archive this product?', text: 'It will be hidden from inventory and the POS. Its stock movements and history are kept.',
      showCancelButton: true, confirmButtonText: 'Archive', confirmButtonColor: '#dc2626' })
    if (!isConfirmed) return
    setBusy(true); setError('')
    try {
      await apiFetch(`/api/v1/inventory-items/${editingProduct.id}/archive/`, { method: 'POST', body: JSON.stringify({ reason: 'Archived via inventory editor' }) }, token())
      onArchived?.(); onClose()
    } catch (err) {
      setError(err instanceof ApiError && err.body && typeof err.body === 'object' && Object.keys(err.body).length ? Object.values(err.body).flat().join(' ') : 'Could not archive the product. Please retry.')
    } finally { setBusy(false) }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!branch || (editingProduct && loadedBranch !== branch)) return; setBusy(true); setError('')
    // The backend still requires a change reason for its audit/revision trail — it's
    // just no longer something the user has to type for every edit.
    const reason = editingProduct ? 'Updated via inventory editor' : 'Created via inventory editor'
    try {
      const result = await apiFetch<Document>(`/api/v1/inventory-items/${editingProduct ? `${editingProduct.id}/` : ''}`, { method: editingProduct ? 'PUT' : 'POST', body: JSON.stringify({ ...doc, data: Object.fromEntries(Object.entries(doc.data).filter(([key]) => !operational.includes(key))), branch, reason, expected_quantity: expectedQuantity, ...(!editingProduct && opening ? { opening_stock: receiptPayload(receipt) } : {}) }) }, token())
      // The tiered document is JSON-only and can't carry a file, so a staged image
      // attaches via a second, separate multipart call once the product has an id.
      const product = imageFile
        ? await updateProduct(result.id!, { image: imageFile }, token())
        : await getProduct(result.id!, token())
      // Refresh the legacy list projection so prices and stock remain consistent.
      const projected = { ...product, total_stock: Number(product.stock_sa || 0) + Number(product.stock_sr || 0) }
      if (editingProduct) onUpdated?.(projected); else onCreated?.(projected)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Could not save inventory. Please check your connection.')
    } finally { setBusy(false) }
  }
  function pickImage(file: File) {
    setImageFile(file)
    setImagePreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
    setDirty(true)
  }
  // A picked barcode also becomes the SKU of a NEW product (existing SKUs are immutable, and a
  // SKU the user typed themselves is left alone) and fills an empty Description.
  function applyLookupBarcode(result: LookupResult) {
    const sku = String(doc.data.sku ?? '').trim(), previousBarcode = String(doc.data.barcode ?? '').trim()
    const description = String(doc.data.description ?? '').trim()
    const suggested = [result.description, result.brand, result.quantity].map(part => part?.trim()).filter(Boolean).join(' · ').slice(0, 255)
    const useSku = !editingProduct && (sku === '' || sku === previousBarcode)
    const useDescription = description === '' && suggested !== ''
    setDoc(current => ({ ...current, data: { ...current.data, barcode: result.barcode,
      ...(useSku && { sku: result.barcode }), ...(useDescription && { description: suggested }) } }))
    setBarcodeTouched(true); setDirty(true)
    return { applied: [...(useSku ? ['SKU'] : []), ...(useDescription ? ['description'] : [])],
      note: !editingProduct && !useSku ? `SKU kept as “${sku}”.` : undefined }
  }

  function renderField(field: Field) {
    const locked = busy || Boolean(editingProduct && loadedBranch !== branch)
    if (field.key === 'image_url') {
      return <div key={field.key} className="col-span-full">
        <ImageAttachmentField label={field.label} value={doc.data.image_url} previewUrl={imagePreviewUrl} disabled={locked} onPick={pickImage}/>
      </div>
    }
    if (field.key === 'quantity') field = { ...field, label: 'Central stock on hand' }
    if (field.key === 'category') field = { ...field, type: 'select', options: categoryOptions }
    if (field.key === 'unit') {
      // Keep the saved unit selectable (receiving may set one that is not in Settings → Units),
      // and fall back to the standard units so the list is never empty.
      const saved = String(doc.data.unit ?? '')
      const options = [...(saved ? [saved] : []), ...unitOptions, ...STANDARD_UNITS]
      field = { ...field, type: 'select', options: options.filter((unit, i) => options.findIndex(o => o.toLowerCase() === unit.toLowerCase()) === i) }
    }
    if (field.key === 'supplier') field = { ...field, type: 'select', options: supplierOptions }
    if (field.key === 'cost_price') {
      const lastSupplier = doc.last_purchase_supplier
      field = { ...field, hint: lastSupplier
        ? `Automatically set from the most recent stock receipt — supplier: ${lastSupplier}.`
        : 'Automatically set from the most recent stock receipt. Supplier unknown (received manually, outside a Purchase Order).' }
    }

    const onChange = (value: unknown) => {
      setDoc(current => {
        const data = { ...current.data, [field.key]: value }
        // Mirror into Barcode until the user edits Barcode themselves — after that,
        // an explicit override should never get silently overwritten again.
        if (field.key === 'sku' && !barcodeTouched) data.barcode = value
        return { ...current, data }
      })
      if (field.key === 'barcode') setBarcodeTouched(true)
      setDirty(true)
    }

    const onAddNew = field.key === 'category' ? () => setAddTarget('category')
      : field.key === 'unit' ? () => setAddTarget('unit')
      : field.key === 'supplier' ? () => setSupplierDialogOpen(true)
      : undefined

    const input = <InventoryField key={field.key} field={field} value={doc.data[field.key]}
      disabled={locked || (field.key === 'sku' && Boolean(editingProduct)) || field.key === 'cost_price'}
      onChange={onChange} onAddNew={onAddNew}/>
    // The online lookup sits right under Product name / SKU: it needs the name, and the barcode,
    // SKU and description it fills in are the fields directly below.
    if (field.key === 'sku') return <Fragment key={field.key}>{input}
      <div className="col-span-full"><ProductLookup name={String(doc.data.name ?? '')} barcode={String(doc.data.barcode ?? '')} disabled={locked} onUseImage={pickImage} onUseBarcode={applyLookupBarcode}/></div>
    </Fragment>
    return input
  }

  async function showHistory() {
    if (!editingProduct) return
    try { setHistory(await apiFetch<Revision[]>(`/api/v1/inventory-items/${editingProduct.id}/history/`, {}, token())) }
    catch { setError('Could not load inventory history.') }
  }

  function selectField(key: string, value: string) {
    setDoc(current => ({ ...current, data: { ...current.data, [key]: value } }))
    setDirty(true)
  }

  async function handleAddCategory(name: string) {
    const created = await createCategory(name, token())
    setCategoryOptions(prev => [...prev, created.name])
    selectField('category', created.name)
  }

  async function handleAddUnit(name: string) {
    const created = await createUnit({ name }, token())
    setUnitOptions(prev => [...prev, created.name])
    selectField('unit', created.name)
  }
  return <div role="dialog" aria-modal="true" aria-label="Inventory editor" className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-2 sm:p-6">
    <form onSubmit={save} className="flex flex-col w-full max-w-5xl max-h-[94dvh] rounded-2xl bg-white text-neutral-900 shadow-2xl overflow-hidden">
      <header className="flex items-center gap-3 p-5 border-b border-neutral-200"><div className="p-2 bg-blue-50 rounded-xl text-blue-700"><Package/></div><div className="flex-1"><h2 className="text-lg font-bold">{editingProduct ? 'Edit master product' : 'New master product'}</h2><p className="text-sm text-neutral-500">Define the product. Receive and track stock by batch.</p></div><button type="button" onClick={onClose} disabled={busy} aria-label="Close inventory editor"><X/></button></header>
      <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
        {error && <div role="alert" className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}{editingProduct && branch && !loading && loadedBranch !== branch && <button type="button" className="ml-3 underline font-semibold" onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }}>Retry</button>}</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{schema.tiers.map(tier => <button key={tier.key} type="button" disabled={busy || loading} onClick={() => { setDoc(current => ({ ...current, tier: tier.key })); setDirty(true) }} className={`text-left rounded-xl p-3 border ${tier.key === doc.tier ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-neutral-200 text-neutral-600'}`}><span className="font-bold text-sm block">{tier.label}</span><span className="text-xs">{tier.description}</span></button>)}</div>
        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Stock held at Head Office / Warehouse / Commissary. Product definitions and pricing are inherited by all branches. Receive deliveries as batches; use Branch Inventory to distribute stock.</p>
        {loading ? <p className="flex gap-2 items-center"><Loader2 className="animate-spin"/> Loading inventory…</p> : <>
          {sections.map(section => {
            const isOpen = openSections.has(section)
            return <section key={section} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => toggleSection(section)}
                className={`w-full flex items-center justify-between px-4 py-3 transition-[filter] hover:brightness-95 text-left ${SECTION_SHADES[section] ?? 'bg-neutral-50 text-neutral-800'}`}>
                <h3 className="font-bold">{section}</h3>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 opacity-60 transition-transform ${isOpen ? '' : '-rotate-90'}`}/>
              </button>
              {isOpen && <div className="p-4 space-y-4">
                {section === 'Inventory Control' && <><StockBalances stock={doc.stock}/>{editingProduct ? <button type="button" className="text-sm text-blue-700 underline" disabled={busy || loading || dirty} onClick={() => { onClose(); onManageStock?.() }}>Receive stock / batches / history</button> : <div className="space-y-3"><label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={opening} disabled={busy} onChange={e => setOpening(e.target.checked)}/>Add opening stock as a batch</label>{opening && <ReceiptFields value={receipt} onChange={setReceipt} disabled={busy}/>}<p className="text-xs text-neutral-500">Without opening stock, the product starts at zero. Record later deliveries with Receive stock.</p></div>}</>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{visible.filter(field => field.section === section).map(renderField)}</div>
              </div>}
            </section>
          })}
          {tierIndex >= 1 && landed > 0 && <div className="rounded-xl bg-blue-50 p-4 flex flex-wrap gap-6 text-sm"><span>Landed unit cost: <strong>₱{landed.toFixed(2)}</strong></span><span>Gross margin: <strong>{margin}</strong></span></div>}
        </>}
        {editingProduct && <button type="button" className="text-blue-700 text-sm flex gap-2" onClick={showHistory}><History size={18}/> Purchase price, stock and change history</button>}
        {history && <section className="space-y-3"><h3 className="font-bold">Recorded changes</h3>{history.length === 0 && <p className="text-sm text-neutral-500">No tiered inventory changes yet. Existing stock movements remain in the stock ledger.</p>}{history.map(entry => <div key={`${entry.branch}-${entry.revision}`} className="border rounded-lg p-3 text-sm"><p className="font-semibold">{entry.reason}</p><p className="text-neutral-500">{new Date(entry.date).toLocaleString()} · {entry.branch} · User {entry.actor}</p><p>Stock: {String(entry.before.data.quantity)} → {String(entry.after.data.quantity)} · Cost: {String(entry.before.data.cost_price)} → {String(entry.after.data.cost_price)} · Price: {String(entry.before.data.selling_price)} → {String(entry.after.data.selling_price)}</p></div>)}</section>}
      </div>
      <footer className="flex justify-end gap-3 p-4 border-t bg-neutral-50">{editingProduct && <button type="button" onClick={archive} disabled={busy || loading || (doc.stock?.on_hand ?? 0) > 0} title={(doc.stock?.on_hand ?? 0) > 0 ? `Stock on hand: ${doc.stock?.on_hand}. Write off or transfer it before archiving.` : undefined} className="mr-auto inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"><Archive size={16}/>Archive product</button>}<button type="button" onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-lg border text-sm">Cancel</button><button type="submit" disabled={busy || loading || !branch || Boolean(editingProduct && loadedBranch !== branch) || Boolean(error && !dirty)} className="rounded-lg px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save main inventory'}</button></footer>
    </form>

    <AddEntityModal label="Category" open={addTarget === 'category'} onClose={() => setAddTarget(null)} onSubmit={handleAddCategory}/>
    <AddEntityModal label="Unit" open={addTarget === 'unit'} onClose={() => setAddTarget(null)} onSubmit={handleAddUnit}/>

    {/* Reuses the real Suppliers > Add Supplier dialog, same as ProductDialog's own
        "+ Add Supplier" shortcut — portaled to <body> since it renders its own <form>,
        which can't nest inside this dialog's <form>, and `elevated` keeps its backdrop
        above this dialog's rather than tied with it. */}
    {supplierDialogOpen && createPortal(
      <SupplierDialog
        open={supplierDialogOpen}
        elevated
        onClose={() => setSupplierDialogOpen(false)}
        onCreated={(s) => { setSupplierOptions(prev => [...prev, s.company_name]); selectField('supplier', s.company_name); setSupplierDialogOpen(false) }}
      />,
      document.body,
    )}
  </div>
}
