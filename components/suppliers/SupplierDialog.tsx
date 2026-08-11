'use client'

import { useEffect, useState } from 'react'
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

const TABS = ['Basic Info', 'Address', 'Business Terms'] as const
type Tab = typeof TABS[number]

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
    <div className={`flex items-center gap-2 min-w-0 ${span2 ? 'col-span-2' : ''}`}>
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
          focus:outline-none focus:ring-2 focus:ring-brand-600
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
            focus:outline-none focus:ring-2 focus:ring-brand-600">
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
    <div className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-neutral-500">{legend}</span>
        {headerExtra}
      </div>
      <fieldset disabled={disabled} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 m-0 p-0 border-0">
        <InlineField label="Unit/House/Bldg No." labelWidth="w-40" name={`${prefix}_unit_bldg_no`} defaultValue={defaultValue?.unit_bldg_no ?? ''} />
        <InlineField label="Street" labelWidth="w-40" name={`${prefix}_street`} defaultValue={defaultValue?.street ?? ''} />
        <InlineField label="Subdivision/Village" labelWidth="w-40" name={`${prefix}_subdivision`} defaultValue={defaultValue?.subdivision ?? ''} />
        <InlineField label="Barangay" labelWidth="w-40" name={`${prefix}_barangay`} defaultValue={defaultValue?.barangay ?? ''} required />
        <InlineField label="City/Municipality" labelWidth="w-40" name={`${prefix}_city`} defaultValue={defaultValue?.city ?? ''}
          required onChange={setCity} />
        {!metro && (
          <InlineField label="Province" labelWidth="w-40" name={`${prefix}_province`} defaultValue={defaultValue?.province ?? ''} required />
        )}
        <InlineField label="Region" labelWidth="w-40" name={`${prefix}_region`} defaultValue={defaultValue?.region ?? ''} />
        <InlineField label="ZIP/Postal Code" labelWidth="w-40" name={`${prefix}_postal_code`} defaultValue={defaultValue?.postal_code ?? ''} />
        <InlineField label="Country" labelWidth="w-40" name={`${prefix}_country`} defaultValue={defaultValue?.country ?? 'Philippines'} />
      </fieldset>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────────

function BasicInfoTab({ s, c, supplierCode }: { s?: Supplier | null; c?: SupplierContact | null; supplierCode: string }) {
  return (
    <>
      <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
        <legend className="px-2 text-xs font-semibold text-neutral-500">Identification</legend>
        <InlineField label="Supplier Code" name="supplier_code" value={supplierCode} readOnly required />
        <InlineField label="Company Name" name="company_name" defaultValue={s?.company_name} required />
        <InlineField label="Trade Name" name="trade_name" defaultValue={s?.trade_name ?? ''} />
        <InlineField label="Legal/Registered Name" name="legal_name" defaultValue={s?.legal_name ?? ''} />
      </fieldset>

      <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
        <legend className="px-2 text-xs font-semibold text-neutral-500">Primary Contact</legend>
        <InlineField label="Contact Name" name="contact_name" defaultValue={c?.contact_name ?? ''} />
        <InlineField label="Position" name="position" defaultValue={c?.position ?? ''} />
        <InlineField label="Phone" name="phone" type="tel" defaultValue={c?.phone ?? ''} />
        <InlineField label="Email" name="email" type="email" defaultValue={c?.email ?? ''} />
      </fieldset>
    </>
  )
}

function AddressTab({ billing, shipping, shippingSameAsBilling, onShippingSameAsBillingChange }: {
  billing?: SupplierAddress | null; shipping?: SupplierAddress | null
  shippingSameAsBilling: boolean; onShippingSameAsBillingChange: (v: boolean) => void
}) {
  return (
    <>
      <AddressFieldset legend="Billing Address" prefix="billing" defaultValue={billing} />

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
    </>
  )
}

function StatusTab({ s }: { s?: Supplier | null }) {
  return (
    <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Status &amp; Classification</legend>
      <div className="flex flex-col gap-2.5">
        <ToggleField label="Active" name="is_active" defaultValue={s?.is_active ?? true} />
        <InlineSelect label="Supplier Type" name="supplier_type" options={SUPPLIER_TYPES} defaultValue={s?.supplier_type} />
      </div>
      <div className="flex flex-col gap-2.5">
        <ToggleField label="Accredited" name="is_accredited" defaultValue={s?.is_accredited ?? false} />
        <NumericField label="Rating (0–5)" name="rating" defaultValue={s?.rating ?? ''} />
      </div>
    </fieldset>
  )
}

function BusinessTermsTab({ s, b }: { s?: Supplier | null; b?: SupplierBankDetail | null }) {
  return (
    <>
      <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
        <legend className="px-2 text-xs font-semibold text-neutral-500">Legal, Tax &amp; Financial</legend>
        <div className="flex flex-col gap-2.5">
          <InlineField label="TIN" name="tin" defaultValue={s?.tin ?? ''} />
          <InlineField label="Business Permit No." name="business_permit_no" defaultValue={s?.business_permit_no ?? ''} />
          <ToggleField label="VAT Registered" name="is_vat_registered" defaultValue={s?.is_vat_registered ?? false} />
        </div>
        <div className="flex flex-col gap-2.5">
          <InlineSelect label="Payment Terms" name="payment_terms" options={PAYMENT_TERMS} defaultValue={s?.payment_terms} />
          <InlineSelect label="Payment Method" name="preferred_payment_method" options={PAYMENT_METHODS} defaultValue={s?.preferred_payment_method ?? undefined} />
          <InlineSelect label="Currency" name="currency" options={CURRENCIES} defaultValue={s?.currency} />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
        <legend className="px-2 text-xs font-semibold text-neutral-500">Bank Detail</legend>
        <InlineField label="Bank Name" name="bank_name" defaultValue={b?.bank_name ?? ''} />
        <InlineField label="Account Name" name="account_name" defaultValue={b?.account_name ?? ''} />
        <InlineField label="Account Number" name="account_number" defaultValue={b?.account_number ?? ''} />
      </fieldset>
    </>
  )
}

function ProcurementTab({ s, cat }: { s?: Supplier | null; cat?: SupplierProductCategory | null }) {
  return (
    <fieldset className="grid grid-cols-1 xl:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
      <legend className="px-2 text-xs font-semibold text-neutral-500">Procurement</legend>
      <div className="flex flex-col gap-2.5">
        <NumericField label="Lead Time (days)" name="lead_time_days" defaultValue={s?.lead_time_days?.toString()} />
        <NumericField label="Minimum Order Qty" name="minimum_order_quantity" defaultValue={s?.minimum_order_quantity?.toString()} />
      </div>
      <div className="flex flex-col gap-2.5">
        <InlineField label="Product/Category Supplied" name="category_name" defaultValue={cat?.category_name ?? ''} />
      </div>
    </fieldset>
  )
}

// ── Dialog shell ─────────────────────────────────────────────────────────────────

export default function SupplierDialog({ open, onClose, onCreated, editingSupplier, onUpdated, elevated }: SupplierDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Basic Info')
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

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                {/* All 3 tabs stay mounted (toggled via CSS, not conditional rendering) so FormData
                    collects every field regardless of which tab was last active. */}
                <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-3 min-h-0">
                  {editingSupplier && (
                    <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-neutral-200 rounded-lg p-3 flex-shrink-0 m-0">
                      <legend className="px-2 text-xs font-semibold text-neutral-500">Audit</legend>
                      <DateField label="Date Created" labelWidth="w-32" defaultValue={editingSupplier.created_at?.slice(0, 10)} />
                      <DateField label="Last Updated" labelWidth="w-32" defaultValue={editingSupplier.updated_at?.slice(0, 10)} />
                    </fieldset>
                  )}
                  <div className={activeTab === 'Basic Info' ? 'flex flex-col gap-3 min-h-0' : 'hidden'}>
                    <BasicInfoTab s={editingSupplier} c={contact} supplierCode={supplierCode} />
                    <StatusTab s={editingSupplier} />
                  </div>
                  <div className={activeTab === 'Address' ? 'flex flex-col gap-3 min-h-0' : 'hidden'}>
                    <AddressTab billing={billingAddr} shipping={shippingAddr}
                      shippingSameAsBilling={shippingSameAsBilling}
                      onShippingSameAsBillingChange={setShippingSameAsBilling} />
                  </div>
                  <div className={activeTab === 'Business Terms' ? 'flex flex-col gap-3 min-h-0' : 'hidden'}>
                    <BusinessTermsTab s={editingSupplier} b={bankDetail} />
                    <ProcurementTab s={editingSupplier} cat={productCategory} />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-3 border-t border-neutral-100 flex-shrink-0">
                  <button type="button" onClick={onClose} disabled={isSaving}
                    className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                      bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || codeLoading}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                      rounded-lg hover:bg-brand-800 transition-colors
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
