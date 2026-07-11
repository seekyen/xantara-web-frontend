'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Store, CreditCard, Receipt, Percent, Bell, Shield, Server,
  Check, RefreshCw, Tag, Search, Plus, X, Pencil, Trash2, Loader2,
} from 'lucide-react'
import Swal from 'sweetalert2'
import ConfirmModal from '@/components/shared/ConfirmModal'
import {
  type Category, type SubCategory,
  getCategories, getCategoriesPaged,
  createCategory, updateCategory, deleteCategory,
  getSubCategories, getSubCategoriesPaged,
  createSubCategory, updateSubCategory, deleteSubCategory,
} from '@/lib/api/categories'

// ── Helpers ───────────────────────────────────────────────────────────────────

const toast = (title: string, icon: 'success' | 'error' = 'success') =>
  Swal.fire({ icon, title, timer: 1600, showConfirmButton: false, timerProgressBar: true })

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'general',       label: 'General',       icon: Store      },
  { id: 'payments',      label: 'Payments',       icon: CreditCard },
  { id: 'receipts',      label: 'Receipts',       icon: Receipt    },
  { id: 'taxes',         label: 'Taxes',          icon: Percent    },
  { id: 'notifications', label: 'Notifications',  icon: Bell       },
  { id: 'security',      label: 'Security',       icon: Shield     },
  { id: 'system',        label: 'System',         icon: Server     },
  { id: 'categories',    label: 'Categories',     icon: Tag        },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-brand-600' : 'bg-neutral-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-brand-600"
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState('general')

  // ── General ──
  const [storeName, setStoreName] = useState('Xantara Makati')
  const [address,   setAddress]   = useState('123 Ayala Ave, Makati City')
  const [phone,     setPhone]     = useState('02-8123-4567')
  const [email,     setEmail]     = useState('makati@xantara.com')
  const [savedMsg,  setSavedMsg]  = useState(false)

  // ── Payments ──
  const [payMethods,    setPayMethods]    = useState({ cash: true, card: true, gcash: true, maya: true })
  const [cardProcessor, setCardProcessor] = useState('PayMongo')
  const [gcashId,       setGcashId]       = useState('GC-12345')
  const [mayaId,        setMayaId]        = useState('MAYA-67890')

  // ── Receipts ──
  const [receiptHeader, setReceiptHeader] = useState('Xantara Makati\n123 Ayala Ave, Makati City')
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping with us!')
  const [autoPrint,     setAutoPrint]     = useState(false)
  const [emailReceipt,  setEmailReceipt]  = useState(true)
  const [showVAT,       setShowVAT]       = useState(true)
  const [showCashier,   setShowCashier]   = useState(true)

  // ── Taxes ──
  const [vatRate,      setVatRate]      = useState('12')
  const [vatInclusive, setVatInclusive] = useState(false)
  const [vatOnReceipt, setVatOnReceipt] = useState(true)

  // ── Notifications ──
  const [notifs, setNotifs] = useState({
    lowStock: true, outOfStock: true, dailySummary: false,
    weeklyReport: true, newCustomer: false, refundProcessed: true,
  })
  const [lowStockThreshold, setLowStockThreshold] = useState('10')

  // ── Security ──
  const [pin,      setPin]      = useState(['', '', '', ''])
  const [timeout,  setTimeout_] = useState('30min')
  const [twoFA,    setTwoFA]    = useState(false)

  // ── System ──
  const [cloudBackup,    setCloudBackup]    = useState(true)
  const [showResetModal, setShowResetModal] = useState(false)

  const handleSave = () => {
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  // ── Categories ──
  const [catInnerTab,  setCatInnerTab]  = useState<'categories' | 'sub-categories'>('categories')
  const [categories,   setCategories]   = useState<Category[]>([])
  const [subCats,      setSubCats]      = useState<SubCategory[]>([])
  const [catsLoading,  setCatsLoading]  = useState(false)
  const [subsLoading,  setSubsLoading]  = useState(false)
  const [isSavingCat,  setIsSavingCat]  = useState(false)
  const [isSavingSub,  setIsSavingSub]  = useState(false)
  const [catSearch,    setCatSearch]    = useState('')
  const [subSearch,    setSubSearch]    = useState('')
  const [subFilter,    setSubFilter]    = useState('all')

  // All categories for dropdowns (fetchAll, unpaginated)
  const [allCategories, setAllCategories] = useState<Category[]>([])

  // Pagination metadata
  const [catPage,    setCatPage]    = useState(1)
  const [catCount,   setCatCount]   = useState(0)
  const [catHasNext, setCatHasNext] = useState(false)
  const [subPage,    setSubPage]    = useState(1)
  const [subCount,   setSubCount]   = useState(0)
  const [subHasNext, setSubHasNext] = useState(false)

  // Category drawer
  const [catDrawer,    setCatDrawer]    = useState(false)
  const [catEditId,    setCatEditId]    = useState<number | null>(null)
  const [catForm,      setCatForm]      = useState({ name: '', is_active: true })
  const [catDelTarget, setCatDelTarget] = useState<Category | null>(null)

  // Sub-category drawer
  const [subDrawer,    setSubDrawer]    = useState(false)
  const [subEditId,    setSubEditId]    = useState<number | null>(null)
  const [subForm,      setSubForm]      = useState({ name: '', categoryCode: '', is_active: true })
  const [subDelTarget, setSubDelTarget] = useState<SubCategory | null>(null)

  const token = () => localStorage.getItem('xantara_pos_access') ?? undefined

  const loadCats = useCallback(async () => {
    setCatsLoading(true)
    try {
      const data = await getCategoriesPaged(catPage, token())
      setCategories(data.results)
      setCatCount(data.count)
      setCatHasNext(data.next !== null)
    } catch { toast('Failed to load categories', 'error') }
    finally { setCatsLoading(false) }
  }, [catPage])

  const loadAllCats = useCallback(async () => {
    try { setAllCategories(await getCategories(token())) }
    catch {}
  }, [])

  const loadSubs = useCallback(async () => {
    setSubsLoading(true)
    try {
      const catCode = subFilter !== 'all' ? subFilter : undefined
      const data    = await getSubCategoriesPaged(subPage, token(), catCode)
      setSubCats(data.results)
      setSubCount(data.count)
      setSubHasNext(data.next !== null)
    } catch { toast('Failed to load sub-categories', 'error') }
    finally { setSubsLoading(false) }
  }, [subPage, subFilter])

  useEffect(() => {
    if (tab === 'categories') { loadCats(); loadSubs(); loadAllCats() }
  }, [tab, loadCats, loadSubs, loadAllCats])

  // Category handlers
  const openAddCat  = () => { setCatEditId(null); setCatForm({ name: '', is_active: true }); setCatDrawer(true) }
  const openEditCat = (c: Category) => { setCatEditId(c.id); setCatForm({ name: c.name, is_active: c.is_active }); setCatDrawer(true) }

  const saveCat = async () => {
    if (!catForm.name.trim()) return toast('Name is required', 'error')
    setIsSavingCat(true)
    try {
      if (catEditId !== null) {
        await updateCategory(catEditId, { name: catForm.name, is_active: catForm.is_active }, token())
        toast('Category updated!')
      } else {
        await createCategory(catForm.name, token())
        toast('Category added!')
      }
      setCatDrawer(false)
      loadCats()
      loadAllCats()
    } catch {
      toast('Failed to save category', 'error')
    } finally {
      setIsSavingCat(false)
    }
  }

  const confirmDeleteCat = async () => {
    if (!catDelTarget) return
    const wasActive = catDelTarget.is_active
    try {
      await deleteCategory(catDelTarget.id, token())
      setCatDelTarget(null)
      toast(wasActive ? 'Category deactivated.' : 'Category activated.')
      loadCats()
      loadSubs()
      loadAllCats()
    } catch {
      setCatDelTarget(null)
      toast('Failed to update category', 'error')
    }
  }

  // Sub-category handlers
  const openAddSub  = () => { setSubEditId(null); setSubForm({ name: '', categoryCode: '', is_active: true }); setSubDrawer(true) }
  const openEditSub = (s: SubCategory) => {
    setSubEditId(s.id)
    setSubForm({ name: s.name, categoryCode: s.category_code, is_active: s.is_active })
    setSubDrawer(true)
  }

  const saveSub = async () => {
    if (!subForm.name.trim()) return toast('Name is required', 'error')
    if (!subForm.categoryCode) return toast('Parent category is required', 'error')
    setIsSavingSub(true)
    try {
      if (subEditId !== null) {
        await updateSubCategory(subEditId, { name: subForm.name, category_code: subForm.categoryCode, is_active: subForm.is_active }, token())
        toast('Sub-category updated!')
      } else {
        await createSubCategory({ name: subForm.name, category_code: subForm.categoryCode }, token())
        toast('Sub-category added!')
      }
      setSubDrawer(false)
      loadSubs()
      loadCats()
    } catch {
      toast('Failed to save sub-category', 'error')
    } finally {
      setIsSavingSub(false)
    }
  }

  const confirmDeleteSub = async () => {
    if (!subDelTarget) return
    const wasActive = subDelTarget.is_active
    try {
      await deleteSubCategory(subDelTarget.id, token())
      setSubDelTarget(null)
      toast(wasActive ? 'Sub-category deactivated.' : 'Sub-category activated.')
      loadSubs()
      loadCats()
    } catch {
      setSubDelTarget(null)
      toast('Failed to update sub-category', 'error')
    }
  }

  // Filtered lists
  const filteredCats = categories.filter((c) =>
    catSearch
      ? c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(catSearch.toLowerCase())
      : true,
  )

  const filteredSubs = subCats.filter((s) =>
    subSearch
      ? s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(subSearch.toLowerCase()) ||
        s.category_detail.name.toLowerCase().includes(subSearch.toLowerCase())
      : true,
  )

  // ── Receipt preview ───────────────────────────────────────────────────────────
  const ReceiptPreview = () => (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 font-mono text-xs">
      <div className="text-center space-y-0.5 mb-3">
        {receiptHeader.split('\n').map((line, i) => (
          <div key={i} className={i === 0 ? 'font-bold text-sm' : 'text-neutral-500'}>{line}</div>
        ))}
      </div>
      <div className="border-t border-dashed border-neutral-300 my-2" />
      <div className="space-y-1 text-neutral-600">
        <div className="flex justify-between"><span>Air Force 1</span><span>₱4,250</span></div>
        <div className="flex justify-between"><span>Slim Fit Tee ×2</span><span>₱1,780</span></div>
      </div>
      <div className="border-t border-dashed border-neutral-300 my-2" />
      {showVAT && (
        <div className="flex justify-between text-neutral-500">
          <span>VAT ({vatRate}%)</span><span>₱724</span>
        </div>
      )}
      <div className="flex justify-between font-bold mt-1">
        <span>TOTAL</span><span>₱6,754</span>
      </div>
      {showCashier && <div className="text-neutral-400 mt-2">Cashier: CK Caagbay</div>}
      <div className="border-t border-dashed border-neutral-300 my-2" />
      <div className="text-center text-neutral-400">{receiptFooter}</div>
    </div>
  )

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-neutral-800">Settings</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Configure your POS system</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-0 mx-6">

        {/* Vertical tab nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium
                  transition-colors border-b border-neutral-100 last:border-0 text-left
                  ${tab === id
                    ? 'bg-brand-50 text-brand-600 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 ml-4 bg-white rounded-xl border border-neutral-200 p-6 min-h-[500px]">

          {/* ── GENERAL ── */}
          {tab === 'general' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-sm font-bold text-neutral-800">Store Information</h2>
              <Field label="Store Name" value={storeName} onChange={setStoreName} placeholder="Xantara Makati" />
              <Field label="Address"    value={address}   onChange={setAddress}   placeholder="123 Ayala Ave" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" value={phone} onChange={setPhone} type="tel"   placeholder="02-8123-4567"    />
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="store@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Currency</label>
                <select className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                  <option>PHP — Philippine Peso (₱)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">Logo</label>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-brand-400 hover:bg-brand-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span className="text-white font-black text-lg">B</span>
                  </div>
                  <p className="text-xs text-neutral-500">Click to upload or drag & drop</p>
                  <p className="text-[10px] text-neutral-400">PNG, JPG up to 2MB</p>
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <div className="space-y-5 max-w-md">
              <h2 className="text-sm font-bold text-neutral-800">Payment Methods</h2>
              <div className="space-y-3">
                {([
                  { key: 'cash',  label: 'Cash',  desc: 'Accept physical cash payments' },
                  { key: 'card',  label: 'Card',  desc: 'Accept credit and debit cards'  },
                  { key: 'gcash', label: 'GCash', desc: 'Accept GCash e-wallet'          },
                  { key: 'maya',  label: 'Maya',  desc: 'Accept Maya e-wallet'           },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-neutral-800">{label}</div>
                      <div className="text-xs text-neutral-400">{desc}</div>
                    </div>
                    <Toggle checked={payMethods[key]} onChange={(v) => setPayMethods((p) => ({ ...p, [key]: v }))} />
                  </div>
                ))}
              </div>
              {payMethods.card  && <Field label="Card Processor"    value={cardProcessor} onChange={setCardProcessor} placeholder="PayMongo"    />}
              {payMethods.gcash && <Field label="GCash Merchant ID" value={gcashId}       onChange={setGcashId}       placeholder="GC-XXXXX"    />}
              {payMethods.maya  && <Field label="Maya Merchant ID"  value={mayaId}        onChange={setMayaId}        placeholder="MAYA-XXXXX"  />}
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── RECEIPTS ── */}
          {tab === 'receipts' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-800">Receipt Settings</h2>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Header Text</label>
                  <textarea rows={3} value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Footer Text</label>
                  <input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                </div>
                {([
                  { key: 'autoPrint',    label: 'Auto-print on checkout', val: autoPrint,    set: setAutoPrint    },
                  { key: 'emailReceipt', label: 'Send email receipt',      val: emailReceipt, set: setEmailReceipt },
                  { key: 'showVAT',      label: 'Show VAT breakdown',       val: showVAT,      set: setShowVAT      },
                  { key: 'showCashier',  label: 'Show cashier name',        val: showCashier,  set: setShowCashier  },
                ] as const).map(({ key, label, val, set }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{label}</span>
                    <Toggle checked={val} onChange={set} />
                  </div>
                ))}
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                  {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
                </button>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Receipt Preview</p>
                <ReceiptPreview />
              </div>
            </div>
          )}

          {/* ── TAXES ── */}
          {tab === 'taxes' && (
            <div className="space-y-5 max-w-sm">
              <h2 className="text-sm font-bold text-neutral-800">Tax Settings</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">VAT Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} min="0" max="100"
                    className="w-28 px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                  <span className="text-sm text-neutral-500">%</span>
                </div>
              </div>
              {([
                { label: 'VAT Inclusive',       val: vatInclusive, set: setVatInclusive },
                { label: 'Show VAT on Receipt', val: vatOnReceipt, set: setVatOnReceipt },
              ] as const).map(({ label, val, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">{label}</span>
                  <Toggle checked={val} onChange={set} />
                </div>
              ))}
              <div className="p-4 bg-neutral-50 rounded-xl text-xs text-neutral-500">
                Current effective rate: {vatInclusive ? `Price already includes ${vatRate}% VAT` : `+${vatRate}% added to price`}
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifications' && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-sm font-bold text-neutral-800">Alert Preferences</h2>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50">
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">Low stock alerts</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-400">Threshold:</span>
                      <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} min="1" max="100"
                        className="w-16 px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-600" />
                      <span className="text-xs text-neutral-400">units</span>
                    </div>
                  </div>
                  <Toggle checked={notifs.lowStock} onChange={(v) => setNotifs((n) => ({ ...n, lowStock: v }))} />
                </div>
                {([
                  { key: 'outOfStock',      label: 'Out of stock alerts',       desc: 'When a product reaches 0 units'   },
                  { key: 'dailySummary',    label: 'Daily sales summary email', desc: 'Sent every day at 11:59 PM'       },
                  { key: 'weeklyReport',    label: 'Weekly report email',       desc: 'Sent every Monday morning'        },
                  { key: 'newCustomer',     label: 'New customer registered',   desc: 'When a new customer is added'     },
                  { key: 'refundProcessed', label: 'Refund processed',          desc: 'When a refund is issued'          },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50">
                    <div>
                      <div className="text-sm font-semibold text-neutral-800">{label}</div>
                      <div className="text-xs text-neutral-400">{desc}</div>
                    </div>
                    <Toggle checked={notifs[key]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-sm font-bold text-neutral-800">Security Settings</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">Change PIN</label>
                <div className="flex items-center gap-3">
                  {pin.map((digit, i) => (
                    <input key={i} type="password" maxLength={1} value={digit}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(-1)
                        const next = [...pin]; next[i] = v; setPin(next)
                        if (v && i < 3) {
                          const inputs = document.querySelectorAll<HTMLInputElement>('.pin-input')
                          inputs[i + 1]?.focus()
                        }
                      }}
                      className="pin-input w-12 h-12 text-center text-lg font-bold border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  ))}
                  <button onClick={() => setPin(['', '', '', ''])} className="text-xs text-neutral-400 hover:text-neutral-600">Clear</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Session Timeout</label>
                <select value={timeout} onChange={(e) => setTimeout_(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hr">1 hour</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Two-Factor Authentication</div>
                  <div className="text-xs text-neutral-400">Require OTP on login</div>
                </div>
                <Toggle checked={twoFA} onChange={setTwoFA} />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Active Sessions</div>
                <div className="space-y-2">
                  {[
                    { device: 'Chrome on Windows', location: 'Makati, PH', active: 'Just now',    current: true  },
                    { device: 'Safari on iPhone',  location: 'Makati, PH', active: '2 hours ago', current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <div>
                        <div className="text-xs font-semibold text-neutral-800">
                          {s.device} {s.current && <span className="text-brand-600">(this device)</span>}
                        </div>
                        <div className="text-[10px] text-neutral-400">{s.location} · {s.active}</div>
                      </div>
                      {!s.current && <button className="text-xs text-danger-600 font-semibold hover:underline">Revoke</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {tab === 'system' && (
            <div className="space-y-5 max-w-md">
              <h2 className="text-sm font-bold text-neutral-800">System</h2>
              <div className="flex items-center gap-3 p-4 bg-success-50 rounded-xl border border-success-600/20">
                <div className="w-2.5 h-2.5 rounded-full bg-success-600" />
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Synced</div>
                  <div className="text-xs text-neutral-400">Last sync: May 24, 2026 · 9:41 AM</div>
                </div>
                <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Force sync
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Cloud Backup</div>
                  <div className="text-xs text-neutral-400">Automatically back up data daily</div>
                </div>
                <Toggle checked={cloudBackup} onChange={setCloudBackup} />
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">Export All Data</button>
                <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">Clear Cache</button>
              </div>
              <div className="text-xs text-neutral-400">App version: v1.0.0</div>
              <div className="border border-danger-600/30 rounded-xl p-4 space-y-3">
                <div className="text-sm font-bold text-danger-600">Danger Zone</div>
                <div className="text-xs text-neutral-500">Resetting will permanently delete all local data. This cannot be undone.</div>
                <button onClick={() => setShowResetModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-danger-600 border border-danger-600/30 rounded-lg hover:bg-danger-50 transition-colors">
                  Reset All Data
                </button>
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {tab === 'categories' && (
            <div>
              {/* Inner tab toggle */}
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 w-fit mb-5">
                {(['categories', 'sub-categories'] as const).map((t) => (
                  <button key={t} onClick={() => setCatInnerTab(t)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize
                      ${catInnerTab === t ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    {t === 'categories' ? 'Categories' : 'Sub-Categories'}
                  </button>
                ))}
              </div>

              {/* ── Categories sub-tab ── */}
              {catInnerTab === 'categories' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="text" placeholder="Search by name or code…"
                        value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                      />
                    </div>
                    <button onClick={openAddCat}
                      className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-800 transition-colors">
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>

                  {/* Table */}
                  {catsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading…</span>
                    </div>
                  ) : filteredCats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                        <Tag className="w-5 h-5 text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-600">No categories yet</p>
                      <p className="text-xs text-neutral-400 mt-1">Click "Add Category" to create your first one</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100">
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-left">Code</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-left">Name</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-center">Sub-categories</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-center">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {filteredCats.map((c) => (
                            <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                                  {c.code}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">{c.name}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-sm text-neutral-500">{c.sub_category_count}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                  ${c.is_active ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                  {c.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => openEditCat(c)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setCatDelTarget(c)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-danger-50 text-neutral-400 hover:text-danger-600 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Categories pagination */}
                  {!catsLoading && catCount > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-neutral-400">{catCount} total</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCatPage((p) => p - 1)}
                          disabled={catPage === 1}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200
                            text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          Prev
                        </button>
                        <span className="px-2 text-xs text-neutral-600 font-medium">Page {catPage}</span>
                        <button
                          onClick={() => setCatPage((p) => p + 1)}
                          disabled={!catHasNext}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200
                            text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-categories sub-tab ── */}
              {catInnerTab === 'sub-categories' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="text" placeholder="Search…"
                        value={subSearch} onChange={(e) => setSubSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                      />
                    </div>
                    <select value={subFilter} onChange={(e) => { setSubFilter(e.target.value); setSubPage(1) }}
                      className="px-3 py-2 text-sm border border-neutral-200 rounded-lg text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
                      <option value="all">All Categories</option>
                      {allCategories.map((c) => (
                        <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                    <button onClick={openAddSub}
                      className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-800 transition-colors">
                      <Plus className="w-4 h-4" /> Add Sub-Category
                    </button>
                  </div>

                  {/* Table */}
                  {subsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading…</span>
                    </div>
                  ) : filteredSubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                        <Tag className="w-5 h-5 text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-600">No sub-categories yet</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {allCategories.length === 0
                          ? 'Create a category first, then add sub-categories'
                          : 'Click "Add Sub-Category" to get started'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100">
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-left">Code</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-left">Name</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-left">Parent Category</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-center">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {filteredSubs.map((s) => (
                            <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                                  {s.code}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">{s.name}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-neutral-600">
                                  {s.category_detail.name}
                                  <span className="text-neutral-400 font-mono ml-1">({s.category_detail.code})</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                  ${s.is_active ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                  {s.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => openEditSub(s)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setSubDelTarget(s)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-danger-50 text-neutral-400 hover:text-danger-600 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Sub-categories pagination */}
                  {!subsLoading && subCount > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-neutral-400">{subCount} total</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSubPage((p) => p - 1)}
                          disabled={subPage === 1}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200
                            text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          Prev
                        </button>
                        <span className="px-2 text-xs text-neutral-600 font-medium">Page {subPage}</span>
                        <button
                          onClick={() => setSubPage((p) => p + 1)}
                          disabled={!subHasNext}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200
                            text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Reset confirm modal ── */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => setShowResetModal(false)}
        title="Reset all data?"
        message="This will permanently delete all products, transactions, customers, and staff data. This action cannot be undone."
        confirmLabel="Reset Everything"
        variant="danger"
      />

      {/* ── Category toggle confirm ── */}
      <ConfirmModal
        isOpen={!!catDelTarget}
        onClose={() => setCatDelTarget(null)}
        onConfirm={confirmDeleteCat}
        title={catDelTarget?.is_active ? 'Deactivate category?' : 'Activate category?'}
        message={catDelTarget?.is_active
          ? `"${catDelTarget?.name}" will be hidden from dropdowns.`
          : `"${catDelTarget?.name}" will be available again in dropdowns.`}
        confirmLabel={catDelTarget?.is_active ? 'Deactivate' : 'Activate'}
        variant="danger"
      />

      {/* ── Sub-category toggle confirm ── */}
      <ConfirmModal
        isOpen={!!subDelTarget}
        onClose={() => setSubDelTarget(null)}
        onConfirm={confirmDeleteSub}
        title={subDelTarget?.is_active ? 'Deactivate sub-category?' : 'Activate sub-category?'}
        message={subDelTarget?.is_active
          ? `"${subDelTarget?.name}" will be hidden from dropdowns.`
          : `"${subDelTarget?.name}" will be available again in dropdowns.`}
        confirmLabel={subDelTarget?.is_active ? 'Deactivate' : 'Activate'}
        variant="danger"
      />

      {/* ── Category drawer backdrop ── */}
      <div onClick={() => setCatDrawer(false)}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300
          ${catDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* ── Category drawer ── */}
      <aside className={`fixed top-0 right-0 h-full w-[380px] z-50 bg-white shadow-2xl flex flex-col
        transition-transform duration-300 ease-in-out
        ${catDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-800">{catEditId ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={() => setCatDrawer(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Category Name <span className="text-danger-600">*</span>
            </label>
            <input
              value={catForm.name}
              onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Beverages"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Code is auto-generated by the server.</p>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Active</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Category will appear in dropdowns</p>
            </div>
            <Toggle checked={catForm.is_active} onChange={(v) => setCatForm((f) => ({ ...f, is_active: v }))} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-2">
          <button onClick={saveCat} disabled={isSavingCat}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isSavingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {catEditId !== null ? 'Update Category' : 'Add Category'}
          </button>
          <button onClick={() => setCatDrawer(false)}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
            Cancel
          </button>
        </div>
      </aside>

      {/* ── Sub-category drawer backdrop ── */}
      <div onClick={() => setSubDrawer(false)}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300
          ${subDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* ── Sub-category drawer ── */}
      <aside className={`fixed top-0 right-0 h-full w-[380px] z-50 bg-white shadow-2xl flex flex-col
        transition-transform duration-300 ease-in-out
        ${subDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-800">{subEditId ? 'Edit Sub-Category' : 'New Sub-Category'}</h2>
          <button onClick={() => setSubDrawer(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Sub-Category Name <span className="text-danger-600">*</span>
            </label>
            <input
              value={subForm.name}
              onChange={(e) => setSubForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Soft Drinks"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Code is auto-generated by the server.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Parent Category <span className="text-danger-600">*</span>
            </label>
            {allCategories.length === 0 ? (
              <p className="text-xs text-neutral-400 py-2">
                No categories yet. Add a category first.
              </p>
            ) : (
              <select
                value={subForm.categoryCode}
                onChange={(e) => setSubForm((f) => ({ ...f, categoryCode: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select a category…</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Active</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Sub-category will appear in dropdowns</p>
            </div>
            <Toggle checked={subForm.is_active} onChange={(v) => setSubForm((f) => ({ ...f, is_active: v }))} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-2">
          <button onClick={saveSub} disabled={isSavingSub}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isSavingSub && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {subEditId !== null ? 'Update Sub-Category' : 'Add Sub-Category'}
          </button>
          <button onClick={() => setSubDrawer(false)}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
            Cancel
          </button>
        </div>
      </aside>

    </div>
  )
}
