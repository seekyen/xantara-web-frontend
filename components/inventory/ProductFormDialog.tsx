'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { type Product } from '@/lib/mock/products'
import { type Category as CatOption } from '@/lib/api/settings/category'
import { type SubCategory as SubCatOption } from '@/lib/api/settings/subcategory'

export type ProductFormData = Partial<Product>

// ── Field helpers ─────────────────────────────────────────────────────────────

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1.5">
        {title}
      </h3>
      <div className="grid grid-cols-5 gap-2.5">{children}</div>
    </div>
  )
}

function FText({ label, value, onChange, placeholder, mono, span2 }: {
  label: string; value: string | undefined; onChange: (v: string) => void
  placeholder?: string; mono?: boolean; span2?: boolean
}) {
  return (
    <div className={span2 ? 'col-span-full' : ''}>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</label>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className={`w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600 ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}

function FDate({ label, value, onChange }: {
  label: string; value: string | undefined | null; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</label>
      <input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </div>
  )
}

function FTime({ label, value, onChange }: {
  label: string; value: string | undefined; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</label>
      <input type="time" step={1} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </div>
  )
}

function FNum({ label, value, onChange, placeholder }: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</label>
      <input type="number" value={value ?? ''} placeholder={placeholder ?? '0'}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </div>
  )
}

function FCheck({ label, value, onChange }: {
  label: string; value: boolean | undefined; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input type="checkbox" checked={value ?? false} onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-neutral-300 accent-brand-600" />
      <span className="text-xs text-neutral-600">{label}</span>
    </label>
  )
}

function FSelect({ label, value, onChange, options, placeholder, span2, disabled }: {
  label: string; value: string | undefined; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string; span2?: boolean; disabled?: boolean
}) {
  return (
    <div className={span2 ? 'col-span-full' : ''}>
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Dialog ────────────────────────────────────────────────────────────────────

interface ProductFormDialogProps {
  open:            boolean
  onClose:         () => void
  onSave:          (data: ProductFormData) => void | Promise<void>
  editingProduct?: ProductFormData | null
  isSaving?:       boolean
  catOptions:      CatOption[]
  subCatOptions:   SubCatOption[]
}

export default function ProductFormDialog({
  open, onClose, onSave, editingProduct, isSaving = false, catOptions, subCatOptions,
}: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductFormData>(() => editingProduct ?? {})

  // Esc to close.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-[1320px] max-w-[97vw]
            max-h-[92vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
            <h2 className="text-base font-bold text-neutral-800">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

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
              <FDate label="Last Price Date" value={form.sell_lastdate} onChange={(v) => setForm((f) => ({ ...f, sell_lastdate: v || null }))} />
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
              <FDate label="Date From" value={form.pro_datefr} onChange={(v) => setForm((f) => ({ ...f, pro_datefr: v || null }))} />
              <FTime label="Time From" value={form.pro_timefr} onChange={(v) => setForm((f) => ({ ...f, pro_timefr: v }))} />
              <FDate label="Date To" value={form.pro_dateto} onChange={(v) => setForm((f) => ({ ...f, pro_dateto: v || null }))} />
              <FTime label="Time To" value={form.pro_timeto} onChange={(v) => setForm((f) => ({ ...f, pro_timeto: v }))} />
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
              <FText label="Planner ID" value={form.planerid} onChange={(v) => setForm((f) => ({ ...f, planerid: v }))} />
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
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
              Cancel
            </button>
            <button onClick={() => onSave(form)}
              disabled={isSaving || !form.descshort || !form.itemcode}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                rounded-lg hover:bg-brand-800 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
