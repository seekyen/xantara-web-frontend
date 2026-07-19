'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, Search, Printer, Plus, Pencil, Trash2, Package,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown,
  Calculator, History, Wand2, ImageUp, Loader2,
  type LucideIcon,
} from 'lucide-react'
import Swal from 'sweetalert2'
import NumericField from '@/components/fields/NumericField'
import DateField from '@/components/fields/DateField'
import BarcodePreview from '@/components/shared/BarcodePreview'
import QRCodePreview from '@/components/shared/QRCodePreview'
import { type BarcodeFormat, getStoredBarcodeFormat } from '@/lib/barcodeFormat'
import { type QRStyleOptions, getStoredQRStyle } from '@/lib/qrStyle'
import { createProduct, updateProduct, type ProductWritePayload } from '@/lib/api/products'
import { type Product } from '@/lib/mock/products'

// Extracts the trailing "(CODE)" portion of a mock option label (e.g. "Beverages (BEVE)" → "BEVE").
// Falls back to the raw label if there's no parenthesized code.
function extractCode(label: string): string {
  const match = label.match(/\(([^)]+)\)\s*$/)
  return match ? match[1] : label
}

// Finds the mock option label whose trailing code matches, so a dropdown can show the
// right label when editing (falls back to the raw code if no mock option matches it).
function findOptionByCode(options: string[], code?: string): string {
  if (!code) return ''
  return options.find((o) => extractCode(o) === code) ?? code
}

const TABS = ['Item Definitions', 'Item Information', 'Purchasing', 'Pricing'] as const
type Tab = typeof TABS[number]

interface AddProductDialogV2Props {
  open:      boolean
  onClose:   () => void
  /** Called with the newly created product after a successful save, so the parent list can refresh. */
  onCreated?: (product: Product) => void
  /** Product being edited — omit/null for Add mode. Pass a stable `key` at the call site
   *  (e.g. `key={editingProduct?.id ?? 'new'}`) so the dialog remounts fresh per product. */
  editingProduct?: Product | null
  /** Called with the updated product after a successful save in Edit mode. */
  onUpdated?: (product: Product) => void
}

// Item Code is lifted to the top-level dialog (not local state) since Row1 —
// and this field — repeats identically at the top of all 4 tabs, and the
// Barcode/QR preview needs the same value regardless of which tab is active.
interface ItemCodeState {
  mode:     'auto' | 'manual'
  resolved: string
  setMode:  (mode: 'auto' | 'manual') => void
  setValue: (value: string) => void
}

// Item Code has two entry modes: auto-generated (system-assigned, read-only) or
// self-input (typed manually). Clicking into the field always asks via a SweetAlert2
// Yes/No confirm, so the user can change their mind. UI preview only — the
// "generated" value is a placeholder.
function ItemCodeField({ labelWidth = 'w-44', itemCode, maxLength }: {
  labelWidth?: string; itemCode: ItemCodeState; maxLength?: number
}) {
  const { mode, resolved, setMode, setValue } = itemCode

  const handleClick = () => {
    Swal.fire({
      icon:              'question',
      title:             'Auto-generate item code?',
      showCancelButton:  true,
      confirmButtonText: 'Yes',
      cancelButtonText:  'No',
    }).then((result) => setMode(result.isConfirmed ? 'auto' : 'manual'))
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>Item Code *</label>
      <input type="text" readOnly={mode === 'auto'} maxLength={maxLength}
        value={resolved}
        onChange={(e) => setValue(e.target.value)}
        onClick={handleClick}
        placeholder="Enter item code…"
        className={`flex-1 min-w-0 w-full px-3 py-2 text-sm font-mono border border-neutral-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-brand-600
          ${mode === 'auto' ? 'bg-neutral-100 text-neutral-400' : ''}`} />
    </div>
  )
}

function InlineField({ label, labelWidth = 'w-28', span2, disabled, defaultValue, placeholder, rightAlign, name }: {
  label: string; labelWidth?: string; span2?: boolean; disabled?: boolean; defaultValue?: string
  placeholder?: string; rightAlign?: boolean; name?: string
}) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${span2 ? 'col-span-2' : ''}`}>
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <input type="text" name={disabled ? undefined : name} disabled={disabled} defaultValue={defaultValue}
        placeholder={placeholder ?? `Enter ${label.replace(/\s*\*$/, '').toLowerCase()}…`}
        className={`flex-1 min-w-0 w-full px-3 py-2 text-sm border border-neutral-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-brand-600
          ${disabled ? 'bg-neutral-100 text-neutral-400' : ''} ${rightAlign ? 'text-right' : ''}`} />
    </div>
  )
}

// Small "Add <Label>" modal — UI-only preview (no backend yet), used by the
// "+ Add …" option at the bottom of each InlineDropdownField.
function AddEntityModal({ label, open, onClose }: { label: string; open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-xl shadow-2xl w-80 p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-800">Add {label}</h3>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">{label} Name</label>
            <input type="text" autoFocus placeholder={`Enter ${label.toLowerCase()} name…`}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md
                focus:outline-none focus:ring-2 focus:ring-brand-600" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-800 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Same inline label-left layout as InlineField, but a searchable combobox — used
// for Row 2's "Name (Code)" dropdowns so it matches Row 3's field style. The
// "+ Add <Label>" action sits right under the search box, above the results, and
// opens a small add-entity modal (UI preview only).
function InlineDropdownField({ label, options, labelWidth = 'w-28', defaultValue, name }: {
  label: string; options: string[]; labelWidth?: string; defaultValue?: string; name?: string
}) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <div ref={wrapperRef} className="relative flex-1 min-w-0">
        {name && <input type="hidden" name={name} value={value ? extractCode(value) : ''} />}
        <button type="button"
          onClick={() => { setOpen((o) => !o); setQuery(''); setTimeout(() => searchRef.current?.focus(), 0) }}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-200
            rounded-md bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 text-left">
          <span className={`truncate ${value ? 'text-neutral-800' : 'text-neutral-400'}`}>
            {value || `Select ${label.toLowerCase()}…`}
          </span>
          <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1 w-full min-w-[200px] bg-white border border-neutral-200
            rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-neutral-100">
              <input ref={searchRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-brand-600" />
            </div>
            <button type="button" onClick={() => { setOpen(false); setAddOpen(true) }}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-brand-600
                hover:bg-brand-50 transition-colors border-b border-neutral-100">
              <Plus className="w-3.5 h-3.5" />
              Add {label}
            </button>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-neutral-400">No results</p>
              )}
              {filtered.map((o) => (
                <button key={o} type="button" onClick={() => { setValue(o); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors
                    ${o === value ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-neutral-700'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <AddEntityModal label={label} open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function Row2({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-2 flex-shrink-0 m-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Item Info</legend>
      {/* left column */}
      <div className="flex flex-col gap-1.5">
        <InlineDropdownField label="Department"   name="deptcode"        options={['Beverages (BEVE)', 'Apparel (APRL)']}
          defaultValue={findOptionByCode(['Beverages (BEVE)', 'Apparel (APRL)'], ep?.deptcode)} />
        <InlineDropdownField label="Class"        name="classcode"       options={['Footwear (FTWR)', 'Accessories (ACCS)']}
          defaultValue={findOptionByCode(['Footwear (FTWR)', 'Accessories (ACCS)'], ep?.classcode)} />
        <InlineDropdownField label="Category"     name="categorycode"    options={['Bags (BAGS)', 'Tops (TOPS)']}
          defaultValue={findOptionByCode(['Bags (BAGS)', 'Tops (TOPS)'], ep?.categorycode)} />
        <InlineDropdownField label="Sub-Category" name="subcategorycode" options={['Casual (CAS)', 'Formal (FRM)']}
          defaultValue={findOptionByCode(['Casual (CAS)', 'Formal (FRM)'], ep?.subcategorycode)} />
        <InlineDropdownField label="Size"         name="size"            options={['Small (S)', 'Medium (M)', 'Large (L)']}
          defaultValue={findOptionByCode(['Small (S)', 'Medium (M)', 'Large (L)'], ep?.size)} />
        <InlineDropdownField label="Color"        name="color"           options={['Black (BLK)', 'White (WHT)']}
          defaultValue={findOptionByCode(['Black (BLK)', 'White (WHT)'], ep?.color)} />
      </div>

      {/* right column */}
      <div className="flex flex-col gap-1.5">
        <InlineField label="Model" />
        <InlineField label="Dimension" name="sell_dimension" defaultValue={ep?.sell_dimension} />
        <InlineDropdownField label="Units" name="sell_uom" options={['Piece (PC)', 'Box (BOX)']}
          defaultValue={findOptionByCode(['Piece (PC)', 'Box (BOX)'], ep?.sell_uom)} />
        <div className="grid grid-cols-2 gap-2 [grid-template-columns:1fr_1fr]">
          <NumericField label="Packing" name="sell_pack" defaultValue={ep?.sell_pack} />
          <NumericField label="Conversion" name="sell_packconv" defaultValue={ep?.sell_packconv?.toString()} />
        </div>
        <InlineDropdownField label="Form" name="form"      options={['Solid (SLD)', 'Liquid (LIQ)']}
          defaultValue={findOptionByCode(['Solid (SLD)', 'Liquid (LIQ)'], ep?.form)} />
        <InlineDropdownField label="Type" name="item_type" options={['Retail (RTL)', 'Wholesale (WHS)']}
          defaultValue={findOptionByCode(['Retail (RTL)', 'Wholesale (WHS)'], ep?.item_type)} />
      </div>
    </fieldset>
  )
}

function CheckboxField({ label, name, defaultChecked }: { label: string; name?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked}
        className="w-4 h-4 rounded border-neutral-300 accent-brand-600" />
      <span className="text-sm text-neutral-600">{label}</span>
    </label>
  )
}

function OptionsBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <fieldset className="w-full xl:w-1/4 flex-shrink-0 border border-neutral-200 rounded-lg p-2 flex flex-col gap-1.5 m-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Options</legend>
      <CheckboxField label="Track Inventory"     name="trackinventory" defaultChecked={ep?.trackinventory} />
      <CheckboxField label="Alternate Codes"     name="withalias"      defaultChecked={ep?.withalias} />
      <CheckboxField label="Weighted / Measured" name="measured"       defaultChecked={ep?.measured} />
      <CheckboxField label="Serial Numbers"      name="withserial"     defaultChecked={ep?.withserial} />
      <CheckboxField label="Generic"             name="generic"        defaultChecked={ep?.generic} />
      <CheckboxField label="Allow Promo"         name="pro_allowed"    defaultChecked={ep?.pro_allowed} />
      <CheckboxField label="Expiry Date"         name="expirydate"     defaultChecked={ep?.expirydate} />
    </fieldset>
  )
}

function StocksOnHandBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <fieldset className="flex-1 min-w-0 border border-neutral-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 m-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Stocks on Hand</legend>

      <div className="flex flex-col gap-1.5 h-full">
        <NumericField label="Selling Area" name="stock_sa" defaultValue={ep?.stock_sa?.toString()} />
        <NumericField label="Stock Room"   name="stock_sr" defaultValue={ep?.stock_sr?.toString()} />
        <NumericField label="Total Stocks" defaultValue={ep?.total_stock?.toString()} />
        <div className="mt-auto">
          <NumericField label="On-order" name="stock_onorder" defaultValue={ep?.stock_onorder?.toString()} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-2 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-neutral-200">
        <DateField label="Date Last Ordered"  labelWidth="w-32" />
        <DateField label="Date Last Received" labelWidth="w-32" />
        <DateField label="Date Last Sold"     labelWidth="w-32" name="sell_lastdate" defaultValue={ep?.sell_lastdate} />
        <DateField label="Entry Date"         labelWidth="w-32" defaultValue={ep?.createddate} />
        <DateField label="Last Update"        labelWidth="w-32" defaultValue={ep?.updateddate} />
      </div>
    </fieldset>
  )
}

function Row3({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="flex flex-col xl:flex-row gap-3 flex-shrink-0">
      <OptionsBox editingProduct={editingProduct} />
      <StocksOnHandBox editingProduct={editingProduct} />
    </div>
  )
}

function Row1({ itemCode }: { itemCode: ItemCodeState }) {
  // Default barcode format comes from Settings > General > Barcode & QR Setup
  // (persisted to localStorage — no backend/database yet). This dialog only ever
  // mounts client-side after a user click, never during SSR, so reading
  // localStorage in the initializer is safe (no hydration mismatch risk).
  const [barcodeFormat] = useState<BarcodeFormat>(() => getStoredBarcodeFormat())
  const [qrStyle] = useState<QRStyleOptions>(() => getStoredQRStyle())
  // EAN13 (13 digits) / UPC (12 digits) can't encode anything longer — cap
  // Item Code entry at 14 characters when either is the active default format.
  const itemCodeMaxLength = (barcodeFormat === 'EAN13' || barcodeFormat === 'UPC') ? 14 : undefined
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageName, setImageName] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  // Revoke the previous object URL whenever it changes/unmounts to avoid leaking memory.
  useEffect(() => () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl) }, [imagePreviewUrl])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageName(file?.name ?? '')
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : ''
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 border border-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
      {/* left — identification fields (7/12) */}
      <div className="xl:col-span-7 p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ItemCodeField labelWidth="w-44" itemCode={itemCode} maxLength={itemCodeMaxLength} />
        <InlineField label="Alternate Code" labelWidth="w-44" name="itemcode2" />
        <InlineField label="Full Description (Long)" labelWidth="w-44" span2 name="desclong" />
        <InlineField label="POS Description" labelWidth="w-44" name="descshort" />
        <InlineField label="Query Text" labelWidth="w-44" name="querytext" />
      </div>

      {/* right — image upload / barcode / QR preview (5/12), side by side */}
      <div className="xl:col-span-5 p-2.5 border-t xl:border-t-0 xl:border-l border-neutral-200 flex gap-2 items-stretch">
        <input ref={imageInputRef} type="file" name="image" accept="image/*" className="hidden"
          onChange={handleImageChange} />
        <button type="button" onClick={() => imageInputRef.current?.click()}
          className="flex-[1] border border-dashed border-neutral-300 rounded-lg bg-neutral-50
            hover:bg-neutral-100 hover:border-brand-600 transition-colors
            flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-brand-600 p-1 text-center overflow-hidden">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt={imageName} className="w-full h-full object-cover rounded" />
          ) : (
            <>
              <ImageUp className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-semibold truncate w-full">Upload Image</span>
            </>
          )}
        </button>
        <div className="flex-[3] border border-dashed border-neutral-300 rounded-lg bg-neutral-50 flex items-center justify-center overflow-hidden p-[5px]">
          {itemCode.resolved
            ? <BarcodePreview value={itemCode.resolved} format={barcodeFormat} />
            : <span className="text-xs text-neutral-400">Barcode</span>}
        </div>
        <div className="flex-[1] border border-dashed border-neutral-300 rounded-lg bg-neutral-50 flex items-center justify-center overflow-hidden p-[5px]">
          {itemCode.resolved
            ? <QRCodePreview value={itemCode.resolved} size={64} style={qrStyle} />
            : <span className="text-xs text-neutral-400">QR Code</span>}
        </div>
      </div>
    </div>
  )
}

function ItemDefinitionsTab({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      {/* row 2 */}
      <Row2 editingProduct={editingProduct} />

      {/* row 3 */}
      <Row3 editingProduct={editingProduct} />
    </div>
  )
}

function SearchField({ label, labelWidth = 'w-36', defaultValue, showResolved = true, name }: {
  label: string; labelWidth?: string; defaultValue?: string; showResolved?: boolean; name?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <input type="text" name={name} defaultValue={defaultValue} placeholder={`Search ${label.toLowerCase()}…`}
        className={`px-3 py-2 text-sm border border-neutral-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-brand-600 ${showResolved ? 'w-40 flex-shrink-0' : 'flex-1'}`} />
      <button type="button"
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-neutral-200
          rounded-md hover:bg-neutral-50 text-neutral-500">
        <Search className="w-4 h-4" />
      </button>
      {showResolved && (
        <input type="text" disabled placeholder="—" readOnly
          className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-md bg-neutral-100 text-neutral-400" />
      )}
    </div>
  )
}

function IconButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button type="button"
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-600
        bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  )
}

function DataTable({ columns }: { columns: string[] }) {
  return (
    <div className="flex-1 min-h-[100px] border border-neutral-200 rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-neutral-500">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={columns.length} className="h-24">&nbsp;</td></tr>
        </tbody>
      </table>
    </div>
  )
}

function ItemInfoTopFields({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <div className="border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-2 flex-shrink-0">
      <SearchField label="Parent/Group Code" name="group" defaultValue={ep?.group} />
      {/* row width reserves the same trailing space as the Signage Printing button below,
          so the 2nd column (Picture File / Item Status) starts at the same x in both rows */}
      <div className="flex items-stretch gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
          <InlineField label="Inventory Code" labelWidth="w-36" name="invcode" defaultValue={ep?.invcode} />
          <InlineField label="Picture File" labelWidth="w-36" name="picturefile" defaultValue={ep?.picturefile} />
        </div>
        <div className="hidden sm:flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold
          invisible flex-shrink-0" aria-hidden="true">
          <Printer className="w-4 h-4" />
          Signage Printing
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
          <InlineField label="General Ledger Code" labelWidth="w-36" name="glcode" defaultValue={ep?.glcode} />
          <div className="flex items-center gap-2">
            <label className="w-36 flex-shrink-0 text-sm text-neutral-600">Item Status</label>
            <select name="active" defaultValue={ep ? String(ep.active) : 'true'}
              className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white
                focus:outline-none focus:ring-2 focus:ring-brand-600">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <button type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-neutral-600
            bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors flex-shrink-0">
          <Printer className="w-4 h-4" />
          Signage Printing
        </button>
      </div>
    </div>
  )
}

function ChildSkuBox() {
  return (
    <fieldset className="border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-2 m-0 flex-[2] min-h-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Child SKU</legend>
      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-h-0">
        <DataTable columns={['SKU Code', 'Style', 'Size', 'Color']} />
        <div className="w-full sm:w-36 flex-shrink-0 flex flex-col gap-2">
          <IconButton icon={Plus} label="New" />
          <IconButton icon={Pencil} label="Update" />
          <IconButton icon={Trash2} label="Remove" />
        </div>
      </div>
    </fieldset>
  )
}

function ItemBundleBox() {
  return (
    <fieldset className="border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-2 m-0 flex-1 min-h-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Item Bundle / Composition</legend>
      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-h-0">
        <DataTable columns={['Itemcode', 'Description', 'Quantity']} />
        <div className="w-full sm:w-36 flex-shrink-0 flex flex-col gap-2">
          <IconButton icon={Package} label="Item Bundle Entry" />
        </div>
      </div>
    </fieldset>
  )
}

function NumberField({ label, labelWidth = 'w-44', defaultValue = 0, name }: {
  label: string; labelWidth?: string; defaultValue?: number; name?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <input type="number" name={name} defaultValue={defaultValue}
        className="flex-1 px-3 py-2 text-sm text-right border border-neutral-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </div>
  )
}

function PaginationControls() {
  const btnCls = "w-7 h-7 flex-shrink-0 flex items-center justify-center border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-500"
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button type="button" className={btnCls}><ChevronsLeft className="w-3.5 h-3.5" /></button>
      <button type="button" className={btnCls}><ChevronLeft className="w-3.5 h-3.5" /></button>
      <input type="text" defaultValue="1"
        className="w-10 h-7 text-center text-xs border border-neutral-200 rounded
          focus:outline-none focus:ring-2 focus:ring-brand-600" />
      <button type="button" className={btnCls}><ChevronRight className="w-3.5 h-3.5" /></button>
      <button type="button" className={btnCls}><ChevronsRight className="w-3.5 h-3.5" /></button>
    </div>
  )
}

function SupplierInfoBox({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-2 flex-shrink-0">
      <SearchField label="Supplier Code" labelWidth="w-32" name="suppliercode" defaultValue={editingProduct?.suppliercode} />
      <InlineField label="Company Name" labelWidth="w-32" disabled />
      <InlineField label="Order Terms" labelWidth="w-32" disabled />
    </div>
  )
}

function OrderingInformationBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <fieldset className="border border-neutral-200 rounded-lg p-2.5 grid grid-cols-1 xl:grid-cols-2 gap-4 flex-shrink-0 m-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Ordering Information</legend>

      {/* left column */}
      <div className="flex flex-col gap-1.5">
        <SearchField label="Order Units" labelWidth="w-32" defaultValue={ep?.sell_uom || 'PC'} showResolved={false} />
        <div className="grid grid-cols-2 gap-2 [grid-template-columns:1fr_1fr]">
          <InlineField label="Packing" labelWidth="w-32" defaultValue={ep?.sell_pack || '1'} />
          <InlineField label="Conversion" labelWidth="w-32" defaultValue={ep?.sell_packconv?.toString() || '1'} />
        </div>
        <InlineField label="Dimension" labelWidth="w-32" defaultValue={ep?.sell_dimension} />
        <InlineField label="Weight" labelWidth="w-32" name="sell_weight" defaultValue={ep?.sell_weight} />
        <div className="flex items-center gap-2">
          <label className="w-32 flex-shrink-0 text-sm text-neutral-600">Origin</label>
          <select defaultValue="Local"
            className="w-32 flex-shrink-0 px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white
              focus:outline-none focus:ring-2 focus:ring-brand-600">
            <option value="Local">Local</option>
            <option value="Imported">Imported</option>
          </select>
          <label className="flex-shrink-0 text-sm text-neutral-600 ml-2">Country Code</label>
          <input type="text" disabled defaultValue="PHP"
            className="w-20 flex-shrink-0 px-3 py-2 text-sm border border-neutral-200 rounded-md
              bg-neutral-100 text-neutral-400" />
        </div>
      </div>

      {/* right column */}
      <div className="flex flex-col gap-1.5">
        <NumberField label="Supplier Minimum Order" />
        <NumberField label="Re-Order Point (ROP)" name="stock_rop" defaultValue={ep?.stock_rop} />
        <NumberField label="Maximum Stock" name="stock_limit" defaultValue={ep?.stock_limit} />
      </div>
    </fieldset>
  )
}

function AlternateSupplierBox() {
  return (
    <fieldset className="border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-2 m-0 flex-1 min-h-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Alternate Suppliers</legend>
      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <DataTable columns={['Alternate/Group Code', 'Description', 'Supplier', 'Type', 'Acq. Cost', 'Last Ordered']} />
          <PaginationControls />
        </div>
        <div className="w-full sm:w-36 flex-shrink-0 flex flex-col gap-2">
          <IconButton icon={Plus} label="New" />
          <IconButton icon={Pencil} label="Update" />
          <IconButton icon={Trash2} label="Remove" />
        </div>
      </div>
    </fieldset>
  )
}

function ActionLink({ icon: Icon, label }: { icon: LucideIcon; label: React.ReactNode }) {
  return (
    <button type="button"
      className="flex items-center gap-1.5 text-xs font-semibold text-brand-600
        hover:text-brand-800 hover:underline flex-shrink-0 leading-tight text-left">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  )
}

function RadioField({ label, value, checked }: { label: string; value: string; checked?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input type="radio" name="pricetype" value={value} defaultChecked={checked}
        className="w-4 h-4 accent-brand-600" />
      <span className="text-sm text-neutral-600">{label}</span>
    </label>
  )
}

function CostBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  const taxCodeOptions = ['Taxable Item (T)', 'Non-Taxable (N)']
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 border border-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
      {/* left — cost fields (9/12) */}
      <div className="xl:col-span-9 p-2.5 flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InlineField label="Supplier First Cost" labelWidth="w-36" rightAlign name="acqcost" defaultValue={ep?.acqcost?.toString()} />
          {/* Codes are a placeholder assumption ('T'/'N') — not yet confirmed against the backend's taxcode values. */}
          <InlineDropdownField label="Tax Code" labelWidth="w-32" name="taxcode"
            options={taxCodeOptions} defaultValue={ep ? findOptionByCode(taxCodeOptions, ep.taxcode) : 'Taxable Item (T)'} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InlineField label="Unit Cost" labelWidth="w-36" rightAlign name="unitcost" defaultValue={ep?.unitcost?.toString()} />
          <InlineField label="Net Landed Cost" labelWidth="w-32" defaultValue={ep?.unitcostave?.toString() ?? '0.00'} rightAlign name="unitcostave" />
        </div>
      </div>

      {/* right — actions (3/12) */}
      <div className="xl:col-span-3 p-2.5 border-t xl:border-t-0 xl:border-l border-neutral-200
        flex flex-row xl:flex-col justify-center items-start gap-3">
        <ActionLink icon={Calculator} label="Compute Cost" />
        <ActionLink icon={History} label="View Cost History" />
      </div>
    </div>
  )
}

function MarkupBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <fieldset className="border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-2 m-0 flex-shrink-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Pricing</legend>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 gap-y-1">
        <span className="hidden sm:block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Percentage Markup</span>
        <span className="hidden sm:block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Selling Price</span>
        <span className="hidden sm:block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Gross Margin</span>
        <span className="hidden sm:block" />

        <div className="flex items-center gap-2">
          <label className="w-16 flex-shrink-0 text-sm text-neutral-600">Retail</label>
          <input type="text" name="markup_rp" defaultValue={ep?.markup_rp?.toString() ?? '0.0000'}
            className="flex-1 min-w-0 px-3 py-2 text-sm text-right border border-neutral-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-brand-600" />
          <span className="flex-shrink-0 text-sm text-neutral-400">%</span>
        </div>
        <InlineField label="Unit Retail" labelWidth="w-20" rightAlign name="sell_price_rp" defaultValue={ep?.sell_price_rp?.toString()} />
        <InlineField label="" labelWidth="w-0" placeholder="0.00" rightAlign />
        <div className="row-span-2 flex items-center justify-center">
          <ActionLink icon={Wand2} label="Round Prices" />
        </div>

        <div className="flex items-center gap-2">
          <label className="w-16 flex-shrink-0 text-sm text-neutral-600">Wholesale</label>
          <input type="text" name="markup_ws" defaultValue={ep?.markup_ws?.toString() ?? '0.0000'}
            className="flex-1 min-w-0 px-3 py-2 text-sm text-right border border-neutral-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-brand-600" />
          <span className="flex-shrink-0 text-sm text-neutral-400">%</span>
        </div>
        <InlineField label="Wholesale" labelWidth="w-20" rightAlign name="sell_price_ws" defaultValue={ep?.sell_price_ws?.toString()} />
        <InlineField label="" labelWidth="w-0" placeholder="0.00" rightAlign />
      </div>
    </fieldset>
  )
}

function MiscOptionsBox({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 flex-shrink-0">
      <NumberField label="Min. Wholesale Qty" labelWidth="w-32" name="minwhlsaleqty" defaultValue={editingProduct?.minwhlsaleqty} />
      <InlineDropdownField label="Multi-Packing" labelWidth="w-28" options={['No', 'Yes']} defaultValue="No" />
      <InlineDropdownField label="Allowed Disc." labelWidth="w-28" options={['0 - ALL', '1 - Staff Only']} defaultValue="0 - ALL" />
    </div>
  )
}

function PriceTypeBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <div className="border border-neutral-200 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600 flex-shrink-0">Price Type</span>
        {/* Codes are a placeholder assumption ('R'/'L'/'H') — not yet confirmed against the backend's pricetype values. */}
        <RadioField label="Regular"     value="R" checked={ep ? ep.pricetype === 'R' : true} />
        <RadioField label="Low Ticket"  value="L" checked={ep?.pricetype === 'L'} />
        <RadioField label="High Ticket" value="H" checked={ep?.pricetype === 'H'} />
      </div>
      <div className="flex items-center gap-3 sm:ml-auto">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide flex-shrink-0">Sales Factor</span>
        <NumberField label="Slow Movement" labelWidth="w-28" name="slowfactor" defaultValue={ep?.slowfactor} />
        <NumberField label="Fast" labelWidth="w-12" name="fastfactor" defaultValue={ep?.fastfactor} />
      </div>
    </div>
  )
}

function PromoInfoBox({ editingProduct }: { editingProduct?: Product | null }) {
  const ep = editingProduct
  return (
    <fieldset className="border border-neutral-200 rounded-lg p-2.5 grid grid-cols-1 xl:grid-cols-2 gap-4 m-0 flex-shrink-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Promo Information</legend>
      <div className="flex flex-col gap-1.5">
        <InlineField label="Promo Price Retail" labelWidth="w-40" rightAlign name="pro_priceret" defaultValue={ep?.pro_priceret?.toString()} />
        <div className="grid grid-cols-2 gap-2">
          <DateField label="Beginning of Promo" labelWidth="w-40" name="pro_datefr" defaultValue={ep?.pro_datefr} />
          <DateField label="Promo End Date" labelWidth="w-40" name="pro_dateto" defaultValue={ep?.pro_dateto} />
        </div>
        {/* Only one Promo Time field in the UI — maps to pro_timefr; backend also has a separate pro_timeto. */}
        <InlineField label="Promo Time" labelWidth="w-40" name="pro_timefr" defaultValue={ep?.pro_timefr} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Extended Retail Price Levels</span>
        <InlineField label="Retail Price 2" labelWidth="w-32" rightAlign name="sell_price2" defaultValue={ep?.sell_price2?.toString()} />
        <InlineField label="Retail Price 3" labelWidth="w-32" rightAlign name="sell_price3" defaultValue={ep?.sell_price3?.toString()} />
      </div>
    </fieldset>
  )
}

function PricingTab({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <CostBox editingProduct={editingProduct} />
      <MarkupBox editingProduct={editingProduct} />
      <MiscOptionsBox editingProduct={editingProduct} />
      <PriceTypeBox editingProduct={editingProduct} />
      <PromoInfoBox editingProduct={editingProduct} />
    </div>
  )
}

function PurchasingTab({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <SupplierInfoBox editingProduct={editingProduct} />
      <OrderingInformationBox editingProduct={editingProduct} />
      <AlternateSupplierBox />
    </div>
  )
}

function ItemInformationTab({ editingProduct }: { editingProduct?: Product | null }) {
  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <ItemInfoTopFields editingProduct={editingProduct} />
      <ChildSkuBox />
      <ItemBundleBox />
    </div>
  )
}

export default function AddProductDialogV2({ open, onClose, onCreated, editingProduct, onUpdated }: AddProductDialogV2Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Item Definitions')
  const [isSaving,  setIsSaving]  = useState(false)
  // Shared across tabs since Row1 (with the Item Code/Barcode/QR preview) is
  // repeated at the top of every tab.
  const [itemCodeMode, setItemCodeMode] = useState<'auto' | 'manual'>('manual')
  const [itemCodeValue, setItemCodeValue] = useState(editingProduct?.itemcode ?? '')
  const itemCode: ItemCodeState = {
    mode:     itemCodeMode,
    resolved: itemCodeMode === 'auto' ? 'ITM-0001' : itemCodeValue,
    setMode:  setItemCodeMode,
    setValue: setItemCodeValue,
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries()) as unknown as Partial<ProductWritePayload>
    payload.itemcode = itemCode.resolved
    // An untouched <input type="file"> still shows up in FormData as an empty File — drop it
    // so we don't submit a bogus zero-byte image when the user never picked one.
    if (payload.image instanceof File && payload.image.size === 0) delete payload.image

    setIsSaving(true)
    try {
      const token = localStorage.getItem('xantara_pos_access') ?? undefined
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload, token)
        onUpdated?.(updated)
      } else {
        const created = await createProduct(payload, token)
        onCreated?.(created)
      }
      Swal.fire({
        icon:              'success',
        title:             editingProduct ? 'Product updated!' : 'Product added!',
        showConfirmButton: false,
        timer:             1800,
        timerProgressBar:  true,
      })
      onClose()
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

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-[98vw] h-[97vh]
            flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100 flex-shrink-0">
            <h2 className="text-base font-bold text-neutral-800">
              {editingProduct ? 'Edit Product' : 'Add Product'} — UI Preview
            </h2>
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

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0"
            onKeyDown={(e) => {
              // Barcode scanners emulate typing + an Enter keystroke — without this, scanning
              // into Item Code (or any field) would auto-submit the whole form prematurely.
              const target = e.target as HTMLElement
              if (e.key === 'Enter' && target.getAttribute('type') !== 'submit') e.preventDefault()
            }}>
            {/* All 4 tabs stay mounted (toggled via CSS, not conditional rendering) so that
                native <input> values survive switching tabs — required for FormData on submit.
                Row1 (Item Code/Barcode/QR) is identical on every tab, so it's rendered once
                here instead of once per tab — avoids duplicate-named inputs in the form. */}
            <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-2 min-h-0">
              <Row1 itemCode={itemCode} />
              <div className={activeTab === 'Item Definitions' ? 'flex flex-col gap-2 min-h-0' : 'hidden'}>
                <ItemDefinitionsTab editingProduct={editingProduct} />
              </div>
              <div className={activeTab === 'Item Information' ? 'flex flex-col gap-2 min-h-0' : 'hidden'}>
                <ItemInformationTab editingProduct={editingProduct} />
              </div>
              <div className={activeTab === 'Purchasing' ? 'flex flex-col gap-2 min-h-0' : 'hidden'}>
                <PurchasingTab editingProduct={editingProduct} />
              </div>
              <div className={activeTab === 'Pricing' ? 'flex flex-col gap-2 min-h-0' : 'hidden'}>
                <PricingTab editingProduct={editingProduct} />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-3 border-t border-neutral-100 flex-shrink-0">
              <button type="button" onClick={onClose} disabled={isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button type="submit" disabled={isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                  rounded-lg hover:bg-brand-800 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
