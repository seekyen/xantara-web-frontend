'use client'
import { useEffect, useRef, useState } from 'react'
import { Calculator, FileSpreadsheet, FileText, History, PackagePlus, Sparkles, Trash2, X } from 'lucide-react'
import UomSilhouette from './UomSilhouette'
import { apiBlob, apiFetch, ApiError } from '@/lib/api/client'
import { getAllSuppliers, type Supplier } from '@/lib/api/suppliers/supplier'
export type StockSummary = { on_hand: number; sellable: number; expired: number; reserved: number; untracked: number; last_restocked: string | null }
export type UnitConversion = { unit: string; factor: string | number }
export type Receipt = { number: string; received_date: string; expiry_date: string; reason: string; supplier_id: string; receive_mode: 'minimum' | 'bulk'; base_uom: string; purchase_uom: string; package_quantity: string; units_per_package: string; package_cost: string; freight_per_unit: string; handling_per_unit: string; other_cost_per_unit: string; markup_percent: string; vat_percent: string; selling_price: string }
const MOVEMENT_STYLES: Record<string, { label: string; badge: string; edge: string }> = {
  receive: { label: 'Received', badge: 'bg-emerald-100 text-emerald-800', edge: 'border-l-emerald-500' },
  opening: { label: 'Opening stock', badge: 'bg-teal-100 text-teal-800', edge: 'border-l-teal-500' },
  write_off: { label: 'Write-off', badge: 'bg-red-100 text-red-800', edge: 'border-l-red-500' },
  transfer_in: { label: 'Transfer in', badge: 'bg-sky-100 text-sky-800', edge: 'border-l-sky-500' },
  transfer_out: { label: 'Transfer out', badge: 'bg-amber-100 text-amber-800', edge: 'border-l-amber-500' },
  deduct: { label: 'Sold / deducted', badge: 'bg-violet-100 text-violet-800', edge: 'border-l-violet-500' },
}
const movementStyle = (kind: string) => MOVEMENT_STYLES[kind] ?? { label: kind.replaceAll('_', ' '), badge: 'bg-neutral-100 text-neutral-700', edge: 'border-l-neutral-400' }
const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
const numberValue = (value: string) => Number(value) || 0
const money = (value: number) => `₱${Number.isFinite(value) ? value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
export const freshReceipt = (unit = 'pc', sellingPrice = 0, costPrice = 0, taxCategory = 'vat12'): Receipt => {
  const vat = taxCategory === 'vat12' ? 12 : 0
  const markup = costPrice > 0 && sellingPrice > 0 ? Math.max(0, ((sellingPrice / (costPrice * (1 + vat / 100))) - 1) * 100) : 20
  return { number: '', received_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }), expiry_date: '', reason: '', supplier_id: '', receive_mode: 'minimum', base_uom: unit || 'pc', purchase_uom: unit || 'pc', package_quantity: '', units_per_package: '1', package_cost: costPrice.toFixed(2), freight_per_unit: '0.00', handling_per_unit: '0.00', other_cost_per_unit: '0.00', markup_percent: markup.toFixed(2), vat_percent: String(vat), selling_price: sellingPrice > 0 ? sellingPrice.toFixed(2) : '' }
}
export const receiptPayload = (value: Receipt, detailed = false) => {
  const packages = Number(value.package_quantity), units = value.receive_mode === 'bulk' ? Number(value.units_per_package) : 1
  const basic = { number: value.number, quantity: packages * units, received_date: value.received_date, expiry_date: value.expiry_date || null, unit_cost: (units > 0 ? numberValue(value.package_cost) / units : 0).toFixed(2), reason: value.reason }
  if (!detailed) return basic
  return { ...basic, supplier_id: value.supplier_id ? Number(value.supplier_id) : null, base_uom: value.base_uom.trim(), purchase_uom: value.receive_mode === 'bulk' ? value.purchase_uom.trim() : value.base_uom.trim(), package_quantity: packages, units_per_package: units, package_cost: numberValue(value.package_cost).toFixed(2), pricing_factors: [{ type: 'Freight', amount: value.freight_per_unit }, { type: 'Handling', amount: value.handling_per_unit }, { type: 'Other', amount: value.other_cost_per_unit }].filter(row => numberValue(row.amount) > 0), markup_percent: numberValue(value.markup_percent).toFixed(2), vat_percent: numberValue(value.vat_percent).toFixed(2), selling_price: numberValue(value.selling_price).toFixed(2) }
}
const input = 'block w-full mt-1 rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-neutral-100 disabled:text-neutral-500'
const token = () => localStorage.getItem('xantara_pos_access') ?? undefined
const BASE_UOMS = ['pc', 'bottle', 'can', 'sachet', 'pack', 'kg', 'g', 'L', 'mL', 'meter']
const BULK_UOMS = ['box', 'carton', 'case', 'tray', 'sack', 'bag', 'bundle', 'dozen', 'pack', 'drum', 'roll', 'pc']
const UOM_LABELS: Record<string, string> = { pc: 'Piece (pc)', bottle: 'Bottle', can: 'Can', sachet: 'Sachet', pack: 'Pack', kg: 'Kilogram (kg)', g: 'Gram (g)', L: 'Liter (L)', mL: 'Milliliter (mL)', meter: 'Meter (m)', box: 'Box', carton: 'Carton', case: 'Case', tray: 'Tray', sack: 'Sack', bag: 'Bag', bundle: 'Bundle', dozen: 'Dozen', drum: 'Drum', roll: 'Roll' }
function ReceivingUomSelect({ label, value, options, onChange, disabled }: { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled: boolean }) {
  const [customSelected, setCustomSelected] = useState(false)
  const custom = customSelected || (value !== '' && !options.includes(value))
  return <div className="space-y-2">
    <label className="block text-sm font-medium">{label}
      <span className={`mt-1 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 ${disabled ? 'opacity-60' : ''}`}>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><UomSilhouette unit={value}/></span>
        <select className="min-w-0 flex-1 rounded-lg bg-white py-2 pr-2 text-sm text-neutral-900 outline-none disabled:bg-neutral-100" value={custom ? '__custom__' : value} required disabled={disabled} onChange={e => { const next = e.target.value; setCustomSelected(next === '__custom__'); onChange(next === '__custom__' ? '' : next) }}>
          <option value="" disabled>Choose a unit</option>
          {options.map(unit => <option key={unit} value={unit}>{UOM_LABELS[unit] || unit}</option>)}
          <option value="__custom__">Custom unit…</option>
        </select>
      </span>
    </label>
    {custom && <label className="block text-sm font-medium">Custom {label.toLowerCase()}<input className={input} value={value} maxLength={10} pattern={'.*\\S.*'} required disabled={disabled} onChange={e => onChange(e.target.value)}/></label>}
  </div>
}
export function StockBalances({ stock }: { stock?: StockSummary }) {
  return <div className="space-y-2"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['On hand', stock?.on_hand ?? 0], ['Available', stock?.sellable ?? 0], ['Expired', stock?.expired ?? 0], ['Reserved', stock?.reserved ?? 0]].map(([label, value]) => <div key={label} className="rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">{label}</p><p className="text-lg font-bold text-neutral-900">{Number(value).toLocaleString()}</p></div>)}</div><p className="text-xs text-neutral-500">Calculated from stock movements. Last received: {stock?.last_restocked ?? 'Not recorded'}. Expired units remain on hand until written off. Expiry dates are valid through the stated day (Philippine time).</p></div>
}
export function ReceiptFields({ value, onChange, disabled }: { value: Receipt; onChange: (value: Receipt) => void; disabled?: boolean }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{([
    ['number', 'Receipt / batch number', 'text'], ['package_quantity', 'Quantity received', 'number'],
    ['received_date', 'Received date', 'date'], ['expiry_date', 'Expiry date (optional)', 'date'],
    ['package_cost', 'Unit cost', 'number'], ['reason', 'Reason / reference', 'text'],
  ] as const).map(([key, label, type]) => <label key={key} className="text-sm font-medium">{label}<input className={input} type={type} value={value[key]} required={key !== 'expiry_date'} disabled={disabled} min={key === 'package_quantity' ? 1 : key === 'package_cost' ? 0 : undefined} step={key === 'package_quantity' ? 1 : key === 'package_cost' ? '.01' : undefined} maxLength={key === 'number' ? 80 : key === 'reason' ? 255 : undefined} onChange={e => onChange({ ...value, [key]: e.target.value })}/></label>)}</div>
}
function ExpandedReceiptFields({ value, onChange, disabled, suppliers }: { value: Receipt; onChange: (value: Receipt) => void; disabled: boolean; suppliers: Supplier[] }) {
  const bulk = value.receive_mode === 'bulk'
  const units = bulk ? numberValue(value.units_per_package) : 1
  const total = numberValue(value.package_quantity) * units
  const unitCost = units > 0 ? Math.round((numberValue(value.package_cost) / units + Number.EPSILON) * 100) / 100 : 0
  const landed = unitCost + numberValue(value.freight_per_unit) + numberValue(value.handling_per_unit) + numberValue(value.other_cost_per_unit)
  const suggested = landed * (1 + numberValue(value.markup_percent) / 100) * (1 + numberValue(value.vat_percent) / 100)
  function field(key: keyof Receipt, label: string, type = 'number', min = 0, max?: number) {
    return <label className="block text-sm font-medium">{label}<input className={input} type={type} value={value[key]} required disabled={disabled} min={type === 'number' ? min : undefined} max={max} step={key === 'package_quantity' || key === 'units_per_package' ? 1 : '.01'} maxLength={type === 'text' ? 10 : undefined} onChange={e => onChange({ ...value, [key]: e.target.value })}/></label>
  }
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Receipt / batch number<input className={input} value={value.number} required maxLength={80} disabled={disabled} onChange={e => onChange({ ...value, number: e.target.value })}/></label>
      <label className="text-sm font-medium">Supplier (optional)<select className={input} value={value.supplier_id} disabled={disabled} onChange={e => onChange({ ...value, supplier_id: e.target.value })}><option value="">No supplier recorded</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>)}</select></label>
      <label className="text-sm font-medium">Received date<input className={input} type="date" value={value.received_date} max={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })} required disabled={disabled} onChange={e => onChange({ ...value, received_date: e.target.value })}/></label>
      <label className="text-sm font-medium">Expiry date (optional)<input className={input} type="date" value={value.expiry_date} min={value.received_date} disabled={disabled} onChange={e => onChange({ ...value, expiry_date: e.target.value })}/></label>
    </div>
    <fieldset disabled={disabled} className="rounded-xl border border-neutral-200 p-4 space-y-3"><legend className="px-2 font-semibold">Quantity and units</legend>
      <div className="flex flex-wrap gap-4">{(['minimum', 'bulk'] as const).map(mode => <label key={mode} className="flex items-center gap-2 text-sm"><input type="radio" name="receive-mode" checked={value.receive_mode === mode} onChange={() => onChange({ ...value, receive_mode: mode, package_cost: '' })}/>{mode === 'minimum' ? 'Individual / minimum units' : 'Bulk / packages'}</label>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ReceivingUomSelect label="Minimum / selling unit" value={value.base_uom} options={BASE_UOMS} disabled={disabled} onChange={unit => onChange({ ...value, base_uom: unit })}/>
        {bulk && <ReceivingUomSelect label="Purchase unit" value={value.purchase_uom} options={BULK_UOMS} disabled={disabled} onChange={unit => onChange({ ...value, purchase_uom: unit })}/> }
        {field('package_quantity', bulk ? 'Packages received' : 'Units received', 'number', 1, 999999999)}
        {bulk && field('units_per_package', 'Minimum units per package', 'number', 1, 999999999)}
        {field('package_cost', bulk ? 'Cost per package (PHP)' : 'Cost per minimum unit (PHP)', 'number', 0, 999999999.99)}
      </div>
      {bulk && <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed border-brand-100 bg-brand-50/50 px-4 py-3 text-brand-600">
        <span className="inline-flex items-center gap-2"><UomSilhouette unit={value.purchase_uom} className="h-8 w-8 shrink-0"/><span className="text-sm font-semibold">1 {value.purchase_uom || 'purchase unit'}</span></span>
        <span className="text-xl font-semibold" aria-label="equals">=</span>
        <span className="inline-flex items-center gap-2"><UomSilhouette unit={value.base_uom} className="h-8 w-8 shrink-0"/><span className="text-sm font-semibold">{units.toLocaleString()} {value.base_uom || 'minimum units'}</span></span>
      </div>}
      <p role="status" className="rounded-lg bg-brand-50 p-3 text-sm font-semibold">Stock to add: {total.toLocaleString()} {value.base_uom} · Cost per minimum unit: {money(unitCost)}</p>
      {total > 999999999 && <p role="alert" className="text-sm text-danger-600">Total quantity must not exceed 999,999,999 minimum units.</p>}
    </fieldset>
    <fieldset disabled={disabled} className="rounded-xl border border-neutral-200 p-4 space-y-3"><legend className="px-2 font-semibold">Costs and selling price</legend>
      <p className="text-xs text-neutral-500">Enter extra costs per minimum unit. The suggestion adds markup to landed cost, then VAT. Selling price is per minimum unit.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {field('freight_per_unit', 'Freight (PHP)', 'number', 0, 999999999.99)}{field('handling_per_unit', 'Handling (PHP)', 'number', 0, 999999999.99)}{field('other_cost_per_unit', 'Other costs (PHP)', 'number', 0, 999999999.99)}
        {field('markup_percent', 'Markup (%)', 'number', 0, 99999.99)}{field('vat_percent', 'VAT (%)', 'number', 0, 100)}{field('selling_price', 'Selling price incl. VAT (PHP)', 'number', 0, 999999999.99)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 p-3"><p className="text-sm"><Calculator className="mr-1 inline h-4 w-4"/>Landed cost: {money(landed)} · Suggested price: <strong>{money(suggested)}</strong></p><button type="button" disabled={disabled || !Number.isFinite(suggested) || suggested > 999999999.99} className="inline-flex items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-600 disabled:opacity-50" onClick={() => onChange({ ...value, selling_price: suggested.toFixed(2) })}><Sparkles className="h-4 w-4"/>Use suggested price</button></div>
      <p className="text-xs text-neutral-500">The latest dated receipt updates the product’s costs, units, supplier, and selling price.</p>
    </fieldset>
    <label className="block text-sm font-medium">Reason / reference<input className={input} value={value.reason} required maxLength={255} disabled={disabled} onChange={e => onChange({ ...value, reason: e.target.value })}/></label>
  </div>
}

type Balance = { id: number; number: string; quantity: number; received_date: string | null; expiry_date: string | null; expired: boolean; unit_cost: string }
type Movement = { id: number; batch: string; kind: string; quantity: number; before: number; after: number; reason: string; date: string; reference: string }
type Result = { stock: StockSummary; batches: Balance[]; history: Movement[] }
export default function StockOperationsDialog({ id, name, branch, close, changed }: { id: number; name: string; branch: string; close: () => void; changed: () => void }) {
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const [mode, setMode] = useState<'history' | 'receive' | 'write-off'>('history')
  const [receipt, setReceipt] = useState(freshReceipt)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [receiptReady, setReceiptReady] = useState(false)
  const [receiptLoad, setReceiptLoad] = useState(0)
  const [exportFrom, setExportFrom] = useState(manilaToday)
  const [exportTo, setExportTo] = useState(manilaToday)
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => { if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [error])
  useEffect(() => {
    let active = true
    Promise.all([apiFetch<{ data: Record<string, unknown> }>(`/api/v1/inventory-items/${id}/?branch=MAIN`, {}, token()), getAllSuppliers(token())]).then(([product, list]) => {
      if (!active) return
      const data = product.data
      const next = freshReceipt(String(data.unit || 'pc'), numberValue(String(data.selling_price ?? 0)), numberValue(String(data.cost_price ?? 0)), String(data.tax_category || 'vat12'))
      const conversions = Array.isArray(data.units) ? data.units as UnitConversion[] : []
      const conversion = conversions.find(row => Number.isInteger(Number(row.factor)) && Number(row.factor) > 1)
      if (conversion) { next.purchase_uom = conversion.unit; next.units_per_package = String(conversion.factor) }
      setReceipt(next); setSuppliers(list.filter(row => row.is_active)); setReceiptReady(true); setError('')
    }).catch(() => { if (active) setError('Could not load receiving defaults and suppliers. Retry receiving setup.') })
    return () => { active = false }
  }, [id, receiptLoad])
  const [balanceId, setBalanceId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  useEffect(() => {
    const timer = window.setInterval(() => setReload(n => n + 1), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    apiFetch<Result>(`/api/v1/inventory-items/${id}/batches/?branch=${encodeURIComponent(branch)}`, {}, token()).then(data => { if (active) { setResult(data); setError('') } }).catch(() => { if (active) setError('Could not load batches. Please retry.') })
    return () => { active = false }
  }, [id, branch, reload])
  async function downloadMovements(file: 'xlsx' | 'pdf') {
    if (exporting) return
    if (!exportFrom || !exportTo) { setError('Choose both a start and an end date for the report.'); return }
    if (exportFrom > exportTo) { setError('The report start date must not be after the end date.'); return }
    setExporting(file); setError('')
    try {
      const query = new URLSearchParams({ branch, file, date_from: exportFrom, date_to: exportTo })
      const blob = await apiBlob(`/api/v1/inventory-items/${id}/movement-report/?${query}`, token())
      const link = document.createElement('a')
      const slug = name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'item'
      link.href = URL.createObjectURL(blob)
      link.download = `stock-movements-${slug}-${branch}-${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}.${file}`
      document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(link.href), 10000)
    } catch (err) { setError(err instanceof ApiError && err.body && typeof err.body === 'object' && Object.keys(err.body).length ? Object.values(err.body).flat().join(' ') : 'Could not create the report. Please retry.') }
    finally { setExporting(null) }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    if (mode === 'receive' && (!receiptReady || !Number.isSafeInteger(Number(receipt.package_quantity) * (receipt.receive_mode === 'bulk' ? Number(receipt.units_per_package) : 1)) || Number(receipt.package_quantity) * (receipt.receive_mode === 'bulk' ? Number(receipt.units_per_package) : 1) > 999999999)) { setError('Check the receiving quantity and setup before recording.'); return }
     setBusy(true); setError('')
    const balance = result?.batches.find(row => String(row.id) === balanceId)
    try {
      await apiFetch(`/api/v1/inventory-items/${id}/${mode}/`, { method: 'POST', body: JSON.stringify(mode === 'receive' ? receiptPayload(receipt, true) : { branch, balance_id: Number(balanceId), quantity: Number(quantity), expected_quantity: balance?.quantity, reason }) }, token())
      setMode('history'); setReceipt(current => ({ ...current, number: '', package_quantity: '', expiry_date: '', reason: '' })); setQuantity(''); setReason(''); setReload(n => n + 1); changed()
    } catch (err) { setError(err instanceof ApiError && err.body && typeof err.body === 'object' ? Object.values(err.body).flat().join(' ') : 'Stock operation failed. Please retry.') }
    finally { setBusy(false) }
  }
  return <div role="dialog" aria-modal="true" aria-label="Stock batches and history" className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"><div className="w-full max-w-4xl max-h-[92dvh] overflow-auto rounded-2xl bg-white p-6 space-y-5 text-neutral-900">
    <div className="flex justify-between gap-3"><div><h2 className="text-lg font-bold">Stock batches — {name}</h2><p className="text-sm text-neutral-500">{branch === 'MAIN' ? 'Head Office / Warehouse / Commissary' : branch}</p></div><button disabled={busy} onClick={close} aria-label="Close stock history" className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"><X className="h-5 w-5"/></button></div>
    {error && <p ref={errorRef} role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" className="ml-2 underline" onClick={() => setReload(n => n + 1)}>Refresh</button></p>}
    {!result ? <p>Loading batches…</p> : <><StockBalances stock={result.stock}/><div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2">{branch === 'MAIN' && <button type="button" disabled={busy} aria-pressed={mode === 'receive'} onClick={() => setMode('receive')} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${mode === 'receive' ? 'border-brand-600 bg-brand-600 text-white shadow-brand-600/20' : 'border-brand-100 bg-white text-brand-600 hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-50 hover:shadow-md'}`}><PackagePlus className="h-4 w-4"/>Receive stock</button>}<button type="button" disabled={busy} aria-pressed={mode === 'write-off'} onClick={() => setMode('write-off')} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${mode === 'write-off' ? 'border-danger-600 bg-danger-600 text-white shadow-danger-600/20' : 'border-danger-600/20 bg-white text-danger-600 hover:-translate-y-0.5 hover:border-danger-600 hover:bg-danger-50 hover:shadow-md'}`}><Trash2 className="h-4 w-4"/>Write off / disposal</button><button type="button" disabled={busy} aria-pressed={mode === 'history'} onClick={() => setMode('history')} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${mode === 'history' ? 'border-neutral-800 bg-neutral-800 text-white shadow-neutral-800/20' : 'border-neutral-200 bg-white text-neutral-600 hover:-translate-y-0.5 hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 hover:shadow-md'}`}><History className="h-4 w-4"/>Batches and history</button></div>
      {mode !== 'history' && <form onSubmit={submit} className="rounded-xl border border-blue-200 p-4 space-y-4"><h3 className="font-bold">{mode === 'receive' ? 'Record a new receipt' : 'Write off physical stock'}</h3>{mode === 'receive' ? <><ExpandedReceiptFields value={receipt} onChange={setReceipt} disabled={busy || !receiptReady} suppliers={suppliers}/>{!receiptReady && <button type="button" className="text-sm text-brand-600 underline" onClick={() => setReceiptLoad(n => n + 1)}>Retry receiving setup</button>}</> : <><label className="block text-sm">Batch<select className={input} value={balanceId} required disabled={busy} onChange={e => setBalanceId(e.target.value)}><option value="">Choose a batch</option>{result.batches.filter(b => b.quantity > 0).map(b => <option key={b.id} value={b.id}>{b.number} — {b.quantity} units{b.expired ? ' (expired)' : ''}</option>)}</select></label><label className="block text-sm">Quantity<input className={input} type="number" min="1" step="1" max={result.batches.find(b => String(b.id) === balanceId)?.quantity} value={quantity} required disabled={busy} onChange={e => setQuantity(e.target.value)}/></label><label className="block text-sm">Reason<input className={input} value={reason} required maxLength={255} disabled={busy} onChange={e => setReason(e.target.value)}/></label></>}<button className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy || (mode === 'receive' && !receiptReady)}>{busy ? 'Recording…' : mode === 'receive' ? 'Record receipt' : 'Confirm write-off'}</button></form>}
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Batch', 'Received', 'Expiry', 'Remaining', 'Status'].map(label => <th className="p-2 border-b" key={label}>{label}</th>)}</tr></thead><tbody>{result.batches.map(b => <tr key={b.id}><td className="p-2">{b.number}</td><td className="p-2">{b.received_date ?? 'Not recorded'}</td><td className="p-2">{b.expiry_date ?? 'Not recorded'}</td><td className="p-2">{b.quantity}</td><td className={'p-2 ' + (b.expired ? 'text-red-700' : '')}>{b.quantity === 0 ? 'Depleted' : b.expired ? 'Expired' : 'In stock'}</td></tr>)}</tbody></table>{!result.batches.length && <p className="py-4 text-sm text-neutral-500">No batches received yet.</p>}</div>
      {mode === 'history' && <section className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><h3 className="font-bold">Stock movement history</h3><div className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium text-neutral-600">From<input type="date" className="mt-0.5 block rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900" value={exportFrom} required max={exportTo || manilaToday()} onChange={e => setExportFrom(e.target.value)}/></label><label className="text-xs font-medium text-neutral-600">To<input type="date" className="mt-0.5 block rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900" value={exportTo} required min={exportFrom || undefined} max={manilaToday()} onChange={e => setExportTo(e.target.value)}/></label>{([['xlsx', 'Excel', FileSpreadsheet], ['pdf', 'PDF', FileText]] as const).map(([kind, label, Icon]) => <button key={kind} type="button" disabled={exporting !== null || !exportFrom || !exportTo} onClick={() => downloadMovements(kind)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-50"><Icon className="h-4 w-4"/>{exporting === kind ? 'Preparing…' : label}</button>)}</div></div><p className="text-xs text-neutral-500">Download the full movement ledger for this item (receiving, sales, write-offs, transfers, adjustments). Both dates are required and default to today; widen the range for older history.</p>{result.history.map(m => { const style = movementStyle(m.kind); return <div key={m.id} className={`rounded-lg border border-l-4 border-neutral-200 p-3 text-sm ${style.edge}`}><p className="flex flex-wrap items-center gap-2 font-semibold"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>{style.label}</span><span>{m.batch}</span><span className={m.quantity > 0 ? 'text-emerald-700' : m.quantity < 0 ? 'text-red-700' : ''}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span></p><p>{m.before} → {m.after} · {m.reason}</p><p className="text-xs text-neutral-500">{new Date(m.date).toLocaleString()} · {m.reference}</p></div> })}{!result.history.length && <p className="text-sm text-neutral-500">No batch movements yet.</p>}</section>}
    </>}
  </div></div>
}
