'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRightLeft, Plus, RefreshCw, Search, X, Package, Download, Pencil, History, Eye } from 'lucide-react'
import { apiFetch, fetchAll, ApiError } from '@/lib/api/client'
import StockOperationsDialog, { type StockSummary } from './StockOperationsDialog'
import InventoryWorkspaceDialog from './InventoryWorkspaceDialog'
import schema from '@/lib/inventory-schema.json'
import BarcodePreview from '@/components/shared/BarcodePreview'

type InventoryDocument = { id: number; branch: string; tier: string; revision: number; stock: StockSummary; data: Record<string, unknown> }
type StockBranch = { code: string; name: string; active: boolean }
const token = () => localStorage.getItem('xantara_pos_access') ?? undefined
const input = 'w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-900'
const button = 'rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'
const central = 'Head Office / Warehouse / Commissary'
function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'You do not have permission to manage inventory.'
    const body = error.body
    if (body && typeof body === 'object') return Object.values(body).flat().join(' ')
    return `Inventory request failed (${error.status}).`
  }
  return 'Could not reach inventory. Please retry.'
}
function Details({ item, close }: { item: InventoryDocument; close: () => void }) {
  return <div role="dialog" aria-modal="true" aria-label="Inherited product details" className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
    <div className="w-full max-w-3xl max-h-[90dvh] overflow-auto rounded-2xl bg-white p-6 text-neutral-900">
      <div className="flex justify-between gap-4"><h2 className="text-lg font-bold">{String(item.data.name)}</h2><button onClick={close} aria-label="Close details"><X /></button></div>
      <p className="my-3 text-sm text-neutral-500">Product definitions and prices come from Main Inventory. Stock and storage details belong to this branch.</p>
      <div className="space-y-4">{schema.fields.filter(field => item.data[field.key] !== undefined && !['expiry_date', 'last_restocked', 'batches'].includes(field.key)).map(field => {
        const value = item.data[field.key]
        return <div key={field.key} className="border-b border-neutral-100 pb-3"><h3 className="text-sm font-semibold">{field.label}</h3>
          {Array.isArray(value) ? <div className="space-y-2 mt-2">{value.length ? value.map((row, i) => <div key={i} className="rounded-lg bg-neutral-50 p-3 text-sm">{Object.entries(row as Record<string, unknown>).map(([key, cell]) => <p key={key}><span className="text-neutral-500">{('fields' in field ? field.fields?.find(child => child.key === key)?.label : undefined) ?? key}: </span>{String(cell)}</p>)}</div>) : <p className="text-sm text-neutral-400">None</p>}</div> : <p className="text-sm break-words">{typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value ?? '')}</p>}
        </div>
      })}</div>
    </div>
  </div>
}

export default function InventoryOverview({ mode }: { mode: 'main' | 'branch' }) {
  const main = mode === 'main'
  const [branch, setBranch] = useState('')
  const [branches, setBranches] = useState<StockBranch[]>([])
  const [items, setItems] = useState<InventoryDocument[]>([])
  const [centralItems, setCentralItems] = useState<InventoryDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState<{ id: number } | 'new' | null>(null)
  const [stockItem, setStockItem] = useState<InventoryDocument | null>(null)
  const [details, setDetails] = useState<InventoryDocument | null>(null)
  const [distribution, setDistribution] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [destination, setDestination] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [distributionError, setDistributionError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => setRevision(n => n + 1), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      fetchAll<StockBranch>('/api/v1/inventory-branches/', token()),
      apiFetch<InventoryDocument[]>('/api/v1/inventory-items/?branch=MAIN', {}, token()),
      !main && branch ? apiFetch<InventoryDocument[]>(`/api/v1/inventory-items/?branch=${encodeURIComponent(branch)}`, {}, token()) : Promise.resolve(null),
    ]).then(([locations, warehouse, branchItems]) => {
      if (!active) return
      const available = locations.filter(location => location.active && location.code !== 'MAIN')
      setBranches(available)
      setCentralItems(warehouse)
      setItems(main ? warehouse : branchItems ?? [])
      if (!main && !available.some(location => location.code === branch)) setBranch(available[0]?.code ?? '')
      setError('')
    }).catch(err => { if (active) { setError(errorText(err)); setItems([]) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [main, branch, revision])

  function refresh() { setLoading(true); setError(''); setRevision(value => value + 1) }
  function openDistribution(item?: InventoryDocument) {
    setSelectedProduct(item ? String(item.id) : '')
    setDestination(main ? '' : branch)
    setQuantity(''); setReason(''); setDistributionError(''); setDistribution(true)
  }
  async function distribute(event: React.FormEvent) {
    event.preventDefault()
    const product = centralItems.find(item => String(item.id) === selectedProduct)
    if (!product || saving) return
    setSaving(true); setDistributionError('')
    try {
      const result = await apiFetch<{ reference: string }>(`/api/v1/inventory-items/${product.id}/distribute/`, { method: 'POST', body: JSON.stringify({ branch: destination, quantity: Number(quantity), expected_quantity: Number(product.data.quantity), reason }) }, token())
      setDistribution(false)
      setSuccess(`Distributed ${quantity} ${String(product.data.unit || 'units')} to ${branches.find(b => b.code === destination)?.name}. Reference: ${result.reference}`)
      refresh()
    } catch (err) { setDistributionError(errorText(err)) }
    finally { setSaving(false) }
  }
  const visible = items.filter(item => `${item.data.name} ${item.data.sku} ${item.data.barcode ?? ''} ${item.data.category ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const selected = centralItems.find(item => String(item.id) === selectedProduct)
  const pageCount = Math.max(1, Math.ceil(visible.length / 15))
  const currentPage = Math.min(page, pageCount)
  function exportCsv() {
    const rows = [['Product', 'SKU', 'Category', 'Unit', 'Price', 'Stock on hand', 'Location'], ...visible.map(item => [item.data.name, item.data.sku, item.data.category, item.data.unit, item.data.selling_price, item.data.quantity, main ? central : branches.find(b => b.code === branch)?.name])]
    const csv = rows.map(row => row.map(value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = main ? 'main-inventory.csv' : `branch-inventory-${branch}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <div className="p-4 sm:p-6 space-y-5 text-neutral-900">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold">{main ? 'Main Inventory' : 'Branch Inventory'}</h1><p className="mt-1 text-sm text-neutral-500">{main ? `${central}: master product definitions and central stock.` : 'Distributed branch stock. Product definitions and prices are inherited from Main Inventory.'}</p></div>
      <div className="flex flex-wrap gap-2"><button className="rounded-lg border bg-white px-3 py-2 text-sm" onClick={refresh} disabled={loading} aria-label="Refresh inventory"><RefreshCw size={18} /></button>
        <button className="rounded-lg border bg-white px-3 py-2 text-sm flex gap-2 items-center" onClick={exportCsv} disabled={loading || !!error}><Download size={16}/>Export</button>
        <button className={button + ' flex gap-2 items-center'} disabled={loading || !!error || !branches.length} onClick={() => openDistribution()}><ArrowRightLeft size={16} />Distribute from main</button>
        {main && <button className={button + ' flex gap-2 items-center'} onClick={() => setEditor('new')}><Plus size={16} />Add product</button>}
      </div>
    </div>
    {!main && <div className="rounded-xl border bg-white p-4 flex flex-wrap items-center gap-4"><label className="text-sm font-semibold">Branch<select aria-label="Branch" className={input + ' mt-1 min-w-56'} value={branch} onChange={event => { setBranch(event.target.value); setLoading(true); setPage(1); setItems([]) }}>{!branches.length && <option value="">No active branches</option>}{branches.map(location => <option key={location.code} value={location.code}>{location.name} ({location.code})</option>)}</select></label><Link className="text-sm text-blue-700 underline" href="/dashboard/branches">Manage branches</Link><Link className="text-sm text-blue-700 underline" href="/dashboard/inventory">Open Main Inventory</Link></div>}
    {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<button className="ml-3 underline" onClick={refresh}>Retry</button></div>}
    {success && <div role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{success}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[
      [main ? 'Master products' : 'Distributed products', items.length],
      [main ? 'Units in central stock' : 'Units at this branch', items.reduce((sum, item) => sum + Number(item.data.quantity || 0), 0)],
      ['Low / out of stock', items.filter(item => Number(item.data.quantity) <= Number(item.data.reorder_level || 0)).length],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5"><p className="text-xs uppercase text-neutral-500 font-semibold">{label}</p><p className="mt-2 text-2xl font-bold">{loading || error ? '—' : value}</p></div>)}</div>
    <div className="relative"><Search className="absolute left-3 top-3 text-neutral-400" size={18}/><input aria-label="Search inventory" className={input + ' pl-10'} placeholder="Search products, SKU or category…" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }}/></div>
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {loading ? <p role="status" className="p-8 text-center text-neutral-500">Loading inventory…</p> : !visible.length ? <div className="p-10 text-center"><Package className="mx-auto mb-3 text-blue-600"/><p className="font-semibold">{search ? 'No matching products' : main ? 'No master products yet' : 'No products distributed to this branch'}</p><p className="text-sm text-neutral-500 mt-2">{main ? 'Add a product and record stock held at the central location.' : 'Distribute available stock from Main Inventory to populate this branch.'}</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-500 text-xs uppercase"><tr>{['Product / SKU', 'Category', 'Unit', 'Selling price', main ? 'Central stock' : 'Branch stock', 'Actions'].map(label => <th className="p-4" key={label}>{label}</th>)}</tr></thead><tbody>{visible.slice((currentPage - 1) * 15, currentPage * 15).map(item => { const imageUrl = item.data.image_url ? `${String(item.data.image_url).startsWith('http') ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '')}${item.data.image_url}` : ''
        return <tr key={item.id} className="border-t border-neutral-100"><td className="p-4"><div className="flex gap-3"><div className="w-[81px] h-[81px] flex-shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">{imageUrl ? <img src={imageUrl} alt={String(item.data.name)} className="w-full h-full object-cover"/> : <Package className="w-8 h-8 text-neutral-300"/>}</div><div className="min-w-0 max-w-40"><p className="font-semibold break-words">{String(item.data.name)}</p><p className="text-xs text-neutral-500 break-all">{String(item.data.sku)}</p><div className="mt-1"><BarcodePreview value={String(item.data.barcode || item.data.sku)} format="CODE128" height={28}/></div></div></div></td><td className="p-4">{String(item.data.category || '—')}</td><td className="p-4">{String(item.data.unit || 'pc')}</td><td className="p-4">₱{Number(item.data.selling_price || 0).toFixed(2)}</td><td className="p-4 font-semibold">{Number(item.data.quantity || 0).toLocaleString()}<p className="text-xs font-normal text-neutral-500">{item.stock.sellable} available · {item.stock.expired} expired</p></td><td className="p-4"><div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" onClick={() => main ? setEditor({ id: item.id }) : setDetails(item)}>{main ? <Pencil size={14}/> : <Eye size={14}/>}{main ? 'Edit product' : 'View details'}</button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" onClick={() => setStockItem(item)}><History size={14}/>Stock / batches / history</button>
              {main && <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:pointer-events-none" disabled={!branches.length || Number(item.stock.sellable) <= 0} onClick={() => openDistribution(item)}><ArrowRightLeft size={14}/>Distribute</button>}
            </div></td></tr> })}</tbody></table></div>}
      <div className="p-4 border-t flex justify-between text-sm text-neutral-500"><span>{visible.length} products</span><div className="flex gap-3"><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>{currentPage} / {pageCount}</span><button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
    </div>
    {editor && <InventoryWorkspaceDialog open editingProduct={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onCreated={refresh} onUpdated={refresh} onArchived={refresh} onManageStock={() => { if (editor !== 'new') setStockItem(items.find(item => item.id === editor.id) ?? null) }}/>}
    {stockItem && <StockOperationsDialog id={stockItem.id} name={String(stockItem.data.name)} branch={main ? 'MAIN' : branch} close={() => setStockItem(null)} changed={refresh}/>}
    {details && <Details item={details} close={() => setDetails(null)}/>}
    {distribution && <div role="dialog" aria-modal="true" aria-label="Distribute central stock" className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"><form onSubmit={distribute} className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4"><h2 className="text-lg font-bold">Distribute central stock</h2><p className="text-sm text-neutral-500">Moves stock from {central} to the selected branch. Product definitions remain shared. Earliest-expiring valid batches move first; expired stock is excluded.</p>
      {distributionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{distributionError}</p>}
      <label className="block text-sm font-semibold">Master product<select className={input + ' mt-1'} value={selectedProduct} required disabled={saving} onChange={event => setSelectedProduct(event.target.value)}><option value="">Choose a product</option>{centralItems.map(item => <option key={item.id} value={item.id}>{String(item.data.name)} — {String(item.data.sku)} ({String(item.stock.sellable)} available)</option>)}</select></label>
      <label className="block text-sm font-semibold">Destination branch<select className={input + ' mt-1'} value={destination} required disabled={saving} onChange={event => setDestination(event.target.value)}><option value="">Choose a branch</option>{branches.map(location => <option key={location.code} value={location.code}>{location.name}</option>)}</select></label>
      <label className="block text-sm font-semibold">Quantity<input className={input + ' mt-1'} type="number" min="1" step="1" max={selected ? Number(selected.stock.sellable) : undefined} required value={quantity} disabled={saving} onChange={event => setQuantity(event.target.value)}/></label>
      <label className="block text-sm font-semibold">Reason / reference<input className={input + ' mt-1'} maxLength={255} required value={reason} disabled={saving} onChange={event => setReason(event.target.value)} placeholder="e.g. Branch replenishment"/></label>
      <div className="flex justify-end gap-3"><button type="button" className="px-4 py-2 text-sm" disabled={saving} onClick={() => setDistribution(false)}>Cancel</button><button type="submit" className={button} disabled={saving || !selected || !destination}>{saving ? 'Distributing…' : 'Confirm distribution'}</button></div>
    </form></div>}
  </div>
}
