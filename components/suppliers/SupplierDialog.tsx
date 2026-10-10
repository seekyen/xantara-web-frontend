'use client'

import { useEffect, useId, useState } from 'react'
import { X, ChevronDown, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import NumericField from '@/components/fields/NumericField'
import DateField from '@/components/fields/DateField'
import { isMetroManila } from '@/lib/ph'
import { sanitizeTextInput } from '@/lib/inputSanitize'
import {
  type Supplier, type SupplierWriteData, type SupplierType,
  SUPPLIER_TYPES, PAYMENT_TERMS, PAYMENT_METHODS, CURRENCIES,
  createSupplier, updateSupplier, deleteSupplier, getAllSuppliers,
} from '@/lib/api/suppliers/supplier'
import {
  type SupplierAddress, type SupplierAddressWriteData, type AddressType,
  getSupplierAddresses, createSupplierAddress, updateSupplierAddress,
} from '@/lib/api/suppliers/address'
import {
  type SupplierContact, type SupplierContactWriteData,
  getSupplierContacts, createSupplierContact, updateSupplierContact,
} from '@/lib/api/suppliers/contact'
import {
  type SupplierBankDetail, type SupplierBankDetailWriteData,
  getSupplierBankDetails, createSupplierBankDetail, updateSupplierBankDetail,
} from '@/lib/api/suppliers/bankDetail'
import {
  type SupplierProductCategory, type SupplierProductCategoryWriteData,
  getSupplierProductCategories, createSupplierProductCategory, updateSupplierProductCategory,
} from '@/lib/api/suppliers/productCategory'

// Basic covers everyday setup; Advanced reveals all optional supplier details.
const TIERS = [
  { label: 'Basic', description: 'Name, contact and status' },
  { label: 'Advanced', description: 'Terms, legal, banking, addresses and performance' },
] as const

const SECTION_SHADES: Record<string, string> = {
  Identification: 'from-green-50 to-green-100 text-green-950',
  'Primary Contact': 'from-green-100 to-green-200 text-green-950',
  Classification: 'from-green-200 to-green-300 text-green-950',
  'Default Terms': 'from-green-300 to-green-400 text-green-950',
  'Legal & Tax': 'from-green-400 to-green-500 text-green-950',
  'Bank Detail': 'from-green-600 to-green-700 text-white',
  Procurement: 'from-green-600 to-green-700 text-white',
  'Billing Address': 'from-green-600 to-green-700 text-white',
  'Shipping/Pickup Address': 'from-green-700 to-green-800 text-white',
  Performance: 'from-green-700 to-green-800 text-white',
  Audit: 'from-green-800 to-green-900 text-white',
}

function SupplierSection({ title, children, headerExtra, defaultOpen = false }: {
  title: string; children: React.ReactNode; headerExtra?: React.ReactNode; defaultOpen?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const id = useId()
  return <section className="rounded-xl border border-green-200 overflow-hidden flex-shrink-0"
    onInvalidCapture={() => setExpanded(true)}>
    <button type="button" aria-expanded={expanded} aria-controls={id}
      onClick={() => setExpanded(value => !value)}
      className={'w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r text-left hover:brightness-95 focus-visible:outline-2 focus-visible:outline-green-700 focus-visible:-outline-offset-2 ' + SECTION_SHADES[title]}>
      <span className="text-sm font-semibold">{title}</span>
      <ChevronDown className={'w-4 h-4 transition-transform ' + (expanded ? 'rotate-180' : '')} />
    </button>
    <div id={id} hidden={!expanded} className="p-3 space-y-3">
      {headerExtra && <div className="flex justify-end">{headerExtra}</div>}
      {children}
    </div>
  </section>
}

interface SupplierDialogProps {
  open:      boolean
  onClose:   () => void
  onCreated?: (supplier: Supplier) => void
  editingSupplier?: Supplier | null
  onUpdated?: (supplier: Supplier) => void
  /** Set when this dialog is opened from within another already-open dialog (e.g. Add
   *  Product's "+ Add Supplier"). The default z-40/z-50 ties with that other dialog's own
   *  z-index, so its backdrop can end up hidden behind the parent dialog's content —
   *  this bumps both above it so the backdrop and dialog always render on top. */
  elevated?: boolean
}

const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined

// ── Shared field primitives (mirrors ProductDialog's label-left inline style) ──────

function InlineField({ label, labelWidth = 'w-40', span2, defaultValue, value, placeholder, name, type = 'text', required, onChange, readOnly }: {
  label: string; labelWidth?: string; span2?: boolean; defaultValue?: string
  placeholder?: string; name?: string; type?: 'text' | 'email' | 'tel' | 'url'; required?: boolean
  /** Uncontrolled input — this only observes typed values (e.g. to react to City for the
   *  Metro Manila check), it doesn't drive the input's value. */
  onChange?: (value: string) => void
  /** Controlled alternative to defaultValue — needed for fields whose value arrives async
   *  after mount (e.g. the auto-generated Supplier Code), since defaultValue only applies
   *  on first render. Pair with `readOnly` so it stays display-only. */
  value?: string
  readOnly?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${span2 ? 'sm:col-span-2' : ''}`}>
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>
        {label}{required && ' *'}
      </label>
      <input type={type} name={name} required={required} readOnly={readOnly}
        {...(value !== undefined ? { value } : { defaultValue })}
        onChange={(e) => {
          if (type === 'text') e.target.value = sanitizeTextInput(e.target.value)
          onChange?.(e.target.value)
        }}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        className={`flex-1 min-w-0 w-full px-3 py-2 text-sm border border-neutral-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-green-600
          ${readOnly ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}`} />
    </div>
  )
}

function InlineSelect({ label, labelWidth = 'w-40', options, defaultValue, name }: {
  label: string; labelWidth?: string; options: string[]; defaultValue?: string; name?: string
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <div className="relative flex-1 min-w-0">
        <select name={name} defaultValue={defaultValue ?? options[0]}
          className="w-full appearance-none px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white
            focus:outline-none focus:ring-2 focus:ring-green-600">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      </div>
    </div>
  )
}

// Yes/No pill toggle — used for Active/Inactive, VAT Registered, Accredited.
function ToggleField({ label, labelWidth = 'w-40', name, defaultValue }: {
  label: string; labelWidth?: string; name: string; defaultValue: boolean
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <input type="hidden" name={name} value={value ? 'true' : 'false'} />
      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
        {[{ v: true, t: 'Yes' }, { v: false, t: 'No' }].map(({ v, t }) => (
          <button key={t} type="button" onClick={() => setValue(v)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors
              ${value === v ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

// Standard PH address breakdown. Province is hidden once City matches a Metro Manila
// city (NCR cities/municipalities don't belong to a province). `prefix` namespaces the
// field names (e.g. "billing_barangay") so handleSubmit can pull two of these out of
// one FormData. `disabled` is used by the Shipping fieldset's "Same as billing" toggle —
// disabled inputs are excluded from FormData, so handleSubmit falls back to the billing
// values for shipping instead of reading (empty) shipping_* fields.
function AddressFieldset({ legend, prefix, defaultValue, disabled, headerExtra }: {
  legend: string; prefix: string; defaultValue?: SupplierAddress | null; disabled?: boolean; headerExtra?: React.ReactNode
}) {
  const [city, setCity] = useState(defaultValue?.city ?? '')
  const metro = isMetroManila(city)
  return (
    <SupplierSection title={legend} headerExtra={headerExtra}>
      <fieldset disabled={disabled} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 m-0 p-0 border-0">
        <InlineField label="Unit/House/Bldg No." labelWidth="w-40" name={`${prefix}_unit_bldg_no`} defaultValue={defaultValue?.unit_bldg_no ?? ''} />
        <InlineField label="Street" labelWidth="w-40" name={`${prefix}_street`} defaultValue={defaultValue?.street ?? ''} />
        <InlineField label="Subdivision/Village" labelWidth="w-40" name={`${prefix}_subdivision`} defaultValue={defaultValue?.subdivision ?? ''} />
        {/* Not HTML-required: these fieldsets stay mounted but hidden on the collapsed
            sections (see the dialog shell below), and a `required` field inside a display:none
            ancestor still blocks native form submission — Chrome logs "not focusable" and
            silently refuses to submit rather than showing a validation message. */}
        <InlineField label="Barangay" labelWidth="w-40" name={`${prefix}_barangay`} defaultValue={defaultValue?.barangay ?? ''} />
        <InlineField label="City/Municipality" labelWidth="w-40" name={`${prefix}_city`} defaultValue={defaultValue?.city ?? ''}
          onChange={setCity} />
        {!metro && (
          <InlineField label="Province" labelWidth="w-40" name={`${prefix}_province`} defaultValue={defaultValue?.province ?? ''} />
        )}
        <InlineField label="Region" labelWidth="w-40" name={`${prefix}_region`} defaultValue={defaultValue?.region ?? ''} />
        <InlineField label="ZIP/Postal Code" labelWidth="w-40" name={`${prefix}_postal_code`} defaultValue={defaultValue?.postal_code ?? ''} />
        <InlineField label="Country" labelWidth="w-40" name={`${prefix}_country`} defaultValue={defaultValue?.country ?? 'Philippines'} />
      </fieldset>
    </SupplierSection>
  )
}

// ── Tier sections ────────────────────────────────────────────────────────────────
// Each section is a self-contained fieldset; the dialog shell below decides which tiers
// are revealed, but every section stays mounted (visibility toggled via CSS) so FormData
// always collects the full record regardless of which tier is currently selected.

function BasicSection({ s, c, supplierCode }: { s?: Supplier | null; c?: SupplierContact | null; supplierCode: string }) {
  return (
    <>
      <SupplierSection title="Identification" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineField label="Supplier Code" name="supplier_code" value={supplierCode} readOnly required />
        <InlineField label="Company Name" name="company_name" defaultValue={s?.company_name} required />
        <ToggleField label="Active" name="is_active" defaultValue={s?.is_active ?? true} />
      </div>
      </SupplierSection>

      <SupplierSection title="Primary Contact" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineField label="Contact Name" name="contact_name" defaultValue={c?.contact_name ?? ''} />
        <InlineField label="Phone" name="phone" type="tel" defaultValue={c?.phone ?? ''} />
        <InlineField label="Email" name="email" type="email" defaultValue={c?.email ?? ''} span2 />
      </div>
      </SupplierSection>
    </>
  )
}

function StandardSection({ s, c, cat }: { s?: Supplier | null; c?: SupplierContact | null; cat?: SupplierProductCategory | null }) {
  return (
    <>
      <SupplierSection title="Classification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineField label="Trade Name" name="trade_name" defaultValue={s?.trade_name ?? ''} />
        <InlineField label="Position" name="position" defaultValue={c?.position ?? ''} />
        <InlineSelect label="Supplier Type" name="supplier_type" options={SUPPLIER_TYPES} defaultValue={s?.supplier_type} />
        <ToggleField label="Accredited" name="is_accredited" defaultValue={s?.is_accredited ?? false} />
      </div>
      </SupplierSection>

      <SupplierSection title="Default Terms">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineSelect label="Payment Terms" name="payment_terms" options={PAYMENT_TERMS} defaultValue={s?.payment_terms} />
        <InlineSelect label="Payment Method" name="preferred_payment_method" options={PAYMENT_METHODS} defaultValue={s?.preferred_payment_method ?? undefined} />
        <InlineSelect label="Currency" name="currency" options={CURRENCIES} defaultValue={s?.currency} />
        <InlineField label="Product/Category Supplied" name="category_name" defaultValue={cat?.category_name ?? ''} />
      </div>
      </SupplierSection>
    </>
  )
}

function MediumSection({ s, b, billing }: { s?: Supplier | null; b?: SupplierBankDetail | null; billing?: SupplierAddress | null }) {
  return (
    <>
      <SupplierSection title="Legal & Tax">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineField label="Legal/Registered Name" name="legal_name" defaultValue={s?.legal_name ?? ''} span2 />
        <InlineField label="TIN" name="tin" defaultValue={s?.tin ?? ''} />
        <InlineField label="Business Permit No." name="business_permit_no" defaultValue={s?.business_permit_no ?? ''} />
        <ToggleField label="VAT Registered" name="is_vat_registered" defaultValue={s?.is_vat_registered ?? false} />
      </div>
      </SupplierSection>

      <SupplierSection title="Bank Detail">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineField label="Bank Name" name="bank_name" defaultValue={b?.bank_name ?? ''} />
        <InlineField label="Account Name" name="account_name" defaultValue={b?.account_name ?? ''} />
        <InlineField label="Account Number" name="account_number" defaultValue={b?.account_number ?? ''} span2 />
      </div>
      </SupplierSection>

      <SupplierSection title="Procurement">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumericField label="Lead Time (days)" name="lead_time_days" defaultValue={s?.lead_time_days?.toString()} />
        <NumericField label="Minimum Order Qty" name="minimum_order_quantity" defaultValue={s?.minimum_order_quantity?.toString()} />
      </div>
      </SupplierSection>

      <AddressFieldset legend="Billing Address" prefix="billing" defaultValue={billing} />
    </>
  )
}

function LargeSection({ s, billing, shipping, shippingSameAsBilling, onShippingSameAsBillingChange }: {
  s?: Supplier | null; billing?: SupplierAddress | null; shipping?: SupplierAddress | null
  shippingSameAsBilling: boolean; onShippingSameAsBillingChange: (v: boolean) => void
}) {
  return (
    <>
      <AddressFieldset key={String(shippingSameAsBilling)} legend="Shipping/Pickup Address" prefix="shipping"
        defaultValue={shippingSameAsBilling ? billing : shipping}
        disabled={shippingSameAsBilling}
        headerExtra={
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer flex-shrink-0">
            <input type="checkbox" checked={shippingSameAsBilling}
              onChange={(e) => onShippingSameAsBillingChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-neutral-300 cursor-pointer" />
            Same as billing address
          </label>
        } />

      <SupplierSection title="Performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumericField label="Rating (0–5)" name="rating" defaultValue={s?.rating ?? ''} />
      </div>
      </SupplierSection>

      {s && (
        <SupplierSection title="Audit">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField label="Date Created" labelWidth="w-32" defaultValue={s.created_at?.slice(0, 10)} />
          <DateField label="Last Updated" labelWidth="w-32" defaultValue={s.updated_at?.slice(0, 10)} />
        </div>
      </SupplierSection>
      )}
    </>
  )
}

// ── Dialog shell ─────────────────────────────────────────────────────────────────

export default function SupplierDialog({ open, onClose, onCreated, editingSupplier, onUpdated, elevated }: SupplierDialogProps) {
  // Existing suppliers start in Advanced so all saved detail groups are available.
  const [tier, setTier] = useState(() => (editingSupplier ? TIERS.length - 1 : 0))
  const [isSaving, setIsSaving]   = useState(false)
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(false)

  // Existing linked sub-resources (Edit mode only) — none of these are embedded in the
  // Supplier response, so they're fetched separately by supplier_id before the form can
  // show correct defaults. Their `.id` (once loaded) tells handleSubmit whether to PATCH
  // an existing row or POST a new one.
  const [subLoading, setSubLoading] = useState(!!editingSupplier)
  const [billingAddr, setBillingAddr]   = useState<SupplierAddress | null>(null)
  const [shippingAddr, setShippingAddr] = useState<SupplierAddress | null>(null)
  const [contact, setContact]           = useState<SupplierContact | null>(null)
  const [bankDetail, setBankDetail]     = useState<SupplierBankDetail | null>(null)
  const [productCategory, setProductCategory] = useState<SupplierProductCategory | null>(null)

  useEffect(() => {
    if (!editingSupplier) return
    const token = authToken()
    let cancelled = false
    Promise.all([
      getSupplierAddresses(editingSupplier.id, token),
      getSupplierContacts(editingSupplier.id, token),
      getSupplierBankDetails(editingSupplier.id, token),
      getSupplierProductCategories(editingSupplier.id, token),
    ]).then(([addresses, contacts, bankDetails, categories]) => {
      if (cancelled) return
      setBillingAddr(addresses.find((a) => a.address_type === 'billing') ?? null)
      setShippingAddr(addresses.find((a) => a.address_type === 'shipping') ?? null)
      setContact(contacts[0] ?? null)
      setBankDetail(bankDetails[0] ?? null)
      setProductCategory(categories[0] ?? null)
    }).catch(() => {}).finally(() => { if (!cancelled) setSubLoading(false) })
    return () => { cancelled = true }
  }, [editingSupplier])

  // supplier_code is NOT auto-generated by the backend (frontend/caller must supply one) —
  // so for a new Supplier, generate the next "SUP-####" by scanning existing suppliers for
  // the highest number in use. The field stays read-only either way (existing code in Edit
  // mode, this generated one in Add mode).
  const [autoSupplierCode, setAutoSupplierCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(!editingSupplier)
  useEffect(() => {
    if (editingSupplier) return
    const token = authToken()
    let cancelled = false
    getAllSuppliers(token).then((all) => {
      if (cancelled) return
      let max = 0
      all.forEach((sup) => {
        const m = sup.supplier_code.match(/^SUP-(\d+)$/)
        if (m) { const n = parseInt(m[1], 10); if (n > max) max = n }
      })
      setAutoSupplierCode(`SUP-${String(max + 1).padStart(4, '0')}`)
    }).catch(() => setAutoSupplierCode('SUP-0001'))
      .finally(() => { if (!cancelled) setCodeLoading(false) })
    return () => { cancelled = true }
  }, [editingSupplier])
  const supplierCode = editingSupplier
    ? editingSupplier.supplier_code
    : (codeLoading ? 'Generating…' : autoSupplierCode)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => String(fd.get(k) ?? '')
    const token = authToken()

    const supplierPayload: SupplierWriteData = {
      supplier_code: get('supplier_code'),
      company_name:  get('company_name'),
      trade_name:    get('trade_name') || null,
      legal_name:    get('legal_name') || null,
      tin:           get('tin') || null,
      business_permit_no: get('business_permit_no') || null,
      is_vat_registered:  get('is_vat_registered') === 'true',
      payment_terms:      get('payment_terms') || 'COD',
      preferred_payment_method: get('preferred_payment_method') || null,
      currency:      get('currency') || 'PHP',
      lead_time_days: Number(get('lead_time_days')) || 0,
      minimum_order_quantity: Number(get('minimum_order_quantity')) || 0,
      supplier_type: (get('supplier_type') || 'local') as SupplierType,
      is_active:     get('is_active') === 'true',
      is_accredited: get('is_accredited') === 'true',
      rating:        get('rating') || null,
    }

    const readAddress = (prefix: string, type: AddressType, supplierId: number): SupplierAddressWriteData => ({
      supplier_id:   supplierId,
      address_type:  type,
      unit_bldg_no:  get(`${prefix}_unit_bldg_no`) || null,
      street:        get(`${prefix}_street`) || null,
      subdivision:   get(`${prefix}_subdivision`) || null,
      barangay:      get(`${prefix}_barangay`),
      city:          get(`${prefix}_city`),
      province:      get(`${prefix}_province`) || null,
      region:        get(`${prefix}_region`) || null,
      postal_code:   get(`${prefix}_postal_code`) || null,
      country:       get(`${prefix}_country`) || 'Philippines',
      is_default:    true,
    })

    setIsSaving(true)
    let supplier: Supplier | null = null
    try {
      supplier = editingSupplier
        ? await updateSupplier(editingSupplier.id, supplierPayload, token)
        : await createSupplier(supplierPayload, token)

      const supplierId = supplier.id
      // Shipping inputs are disabled (excluded from FormData) while "Same as billing" is
      // checked, so read the billing_* fields for shipping's payload in that case.
      const billingPayload  = readAddress('billing', 'billing', supplierId)
      const shippingPayload = shippingSameAsBilling
        ? { ...readAddress('billing', 'shipping', supplierId) }
        : readAddress('shipping', 'shipping', supplierId)
      const contactPayload: SupplierContactWriteData = {
        supplier_id: supplierId, contact_name: get('contact_name'), position: get('position') || null,
        phone: get('phone') || null, email: get('email') || null, is_primary: true,
      }
      const bankPayload: SupplierBankDetailWriteData = {
        supplier_id: supplierId, bank_name: get('bank_name'), account_name: get('account_name'),
        account_number: get('account_number'), is_default: true,
      }
      const categoryPayload: SupplierProductCategoryWriteData = {
        supplier_id: supplierId, category_name: get('category_name'),
      }

      try {
        await Promise.all([
          billingAddr ? updateSupplierAddress(billingAddr.id, billingPayload, token) : createSupplierAddress(billingPayload, token),
          shippingAddr ? updateSupplierAddress(shippingAddr.id, shippingPayload, token) : createSupplierAddress(shippingPayload, token),
          contact ? updateSupplierContact(contact.id, contactPayload, token) : createSupplierContact(contactPayload, token),
          bankDetail ? updateSupplierBankDetail(bankDetail.id, bankPayload, token) : createSupplierBankDetail(bankPayload, token),
          productCategory ? updateSupplierProductCategory(productCategory.id, categoryPayload, token) : createSupplierProductCategory(categoryPayload, token),
        ])
      } catch (subErr) {
        // Only roll back on the Create path — an Edit's Supplier update already succeeded
        // and deleting it would destroy an existing, otherwise-valid record.
        if (!editingSupplier) await deleteSupplier(supplierId, token).catch(() => {})
        throw subErr
      }

      if (editingSupplier) onUpdated?.(supplier)
      else onCreated?.(supplier)
      Swal.fire({
        icon:              'success',
        title:             editingSupplier ? 'Supplier updated!' : 'Supplier added!',
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
      const rolledBack = supplier && !editingSupplier
      Swal.fire({
        icon: 'error',
        title: rolledBack ? 'Save failed — rolled back' : 'Save failed',
        text: detail,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className={`fixed inset-0 ${elevated ? 'z-[70]' : 'z-40'} bg-black/40 backdrop-blur-sm`} onClick={onClose} />
      <div className={`fixed inset-0 ${elevated ? 'z-[70]' : 'z-50'} flex items-center justify-center p-2 pointer-events-none`}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-[95vw] max-w-4xl h-[90vh]
            flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100 flex-shrink-0">
            <h2 className="text-base font-bold text-neutral-800">
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {subLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading supplier details…</span>
            </div>
          ) : (
            <>
              <div className="px-6 pt-3 flex-shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  {TIERS.map((t, i) => (
                    <button key={t.label} type="button" onClick={() => setTier(i)} aria-pressed={i === tier}
                      className={`text-left rounded-xl p-2.5 border transition-colors
                        ${i === tier
                          ? 'border-green-600 bg-gradient-to-r from-green-50 to-green-100 text-green-900'
                          : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                        }`}>
                      <span className="font-bold text-xs sm:text-sm block">{t.label}</span>
                      <span className="text-[11px] sm:text-xs">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} onInvalidCapture={e => {
                const input = e.target as HTMLInputElement
                if (input.getClientRects().length) return
                // Expand hidden invalid fields before displaying native validation.
                e.preventDefault()
                if (input.closest('[data-advanced]')) setTier(1)
                requestAnimationFrame(() => {
                  if (input.form?.querySelector(':invalid') === input) {
                    input.focus()
                    input.reportValidity()
                  }
                })
              }} className="flex-1 flex flex-col min-h-0">
                {/* Every tier's sections stay mounted (visibility toggled via CSS, not conditional
                    rendering) so FormData always collects the full record on submit, cumulatively
                    revealing more detail as the tier increases rather than gating what gets saved. */}
                <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-3 min-h-0">
                  <div className={tier >= 0 ? 'flex flex-col gap-3' : 'hidden'}>
                    <BasicSection s={editingSupplier} c={contact} supplierCode={supplierCode} />
                  </div>
                  <div data-advanced className={tier >= 1 ? 'flex flex-col gap-3' : 'hidden'}>
                    <StandardSection s={editingSupplier} c={contact} cat={productCategory} />
                  </div>
                  <div data-advanced className={tier >= 1 ? 'flex flex-col gap-3' : 'hidden'}>
                    <MediumSection s={editingSupplier} b={bankDetail} billing={billingAddr} />
                  </div>
                  <div data-advanced className={tier >= 1 ? 'flex flex-col gap-3' : 'hidden'}>
                    <LargeSection s={editingSupplier} billing={billingAddr} shipping={shippingAddr}
                      shippingSameAsBilling={shippingSameAsBilling}
                      onShippingSameAsBillingChange={setShippingSameAsBilling} />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-3 border-t border-neutral-100 flex-shrink-0">
                  <button type="button" onClick={onClose} disabled={isSaving}
                    className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                      bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || codeLoading}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-800
                      rounded-lg hover:brightness-95 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {(isSaving || codeLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
