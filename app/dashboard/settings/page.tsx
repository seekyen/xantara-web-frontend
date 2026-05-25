'use client'

// TODO: Replace local state with API call → GET/PATCH /api/settings

import { useState } from 'react'
import {
  Store, GitBranch, CreditCard, Receipt, Percent,
  Bell, Shield, Server, Check, RefreshCw,
} from 'lucide-react'
import ConfirmModal from '@/components/shared/ConfirmModal'

// ── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',       label: 'General',       icon: Store      },
  { id: 'branches',      label: 'Branches',       icon: GitBranch  },
  { id: 'payments',      label: 'Payments',       icon: CreditCard },
  { id: 'receipts',      label: 'Receipts',       icon: Receipt    },
  { id: 'taxes',         label: 'Taxes',          icon: Percent    },
  { id: 'notifications', label: 'Notifications',  icon: Bell       },
  { id: 'security',      label: 'Security',       icon: Shield     },
  { id: 'system',        label: 'System',         icon: Server     },
]

// ── Toggle component ─────────────────────────────────────────────────────────
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

// ── Field component ──────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState('general')

  // ── General ──
  const [storeName,  setStoreName]  = useState('Xantara Makati')
  const [address,    setAddress]    = useState('123 Ayala Ave, Makati City')
  const [phone,      setPhone]      = useState('02-8123-4567')
  const [email,      setEmail]      = useState('makati@xantara.com')
  const [savedMsg,   setSavedMsg]   = useState(false)

  // ── Branches ──
  const [branches, setBranches] = useState([
    { id: 'b1', name: 'Makati',  address: '123 Ayala Ave',    cashiers: 3, active: true  },
    { id: 'b2', name: 'BGC',     address: '456 BGC High St',  cashiers: 2, active: true  },
    { id: 'b3', name: 'Quezon',  address: '789 Quezon Blvd',  cashiers: 2, active: false },
  ])

  // ── Payments ──
  const [payMethods, setPayMethods] = useState({
    cash: true, card: true, gcash: true, maya: true,
  })
  const [cardProcessor, setCardProcessor] = useState('PayMongo')
  const [gcashId,       setGcashId]       = useState('GC-12345')
  const [mayaId,        setMayaId]        = useState('MAYA-67890')

  // ── Receipts ──
  const [receiptHeader, setReceiptHeader]   = useState('Xantara Makati\n123 Ayala Ave, Makati City')
  const [receiptFooter, setReceiptFooter]   = useState('Thank you for shopping with us!')
  const [autoPrint,     setAutoPrint]       = useState(false)
  const [emailReceipt,  setEmailReceipt]    = useState(true)
  const [showVAT,       setShowVAT]         = useState(true)
  const [showCashier,   setShowCashier]     = useState(true)

  // ── Taxes ──
  const [vatRate,      setVatRate]      = useState('12')
  const [vatInclusive, setVatInclusive] = useState(false)
  const [vatOnReceipt, setVatOnReceipt] = useState(true)

  // ── Notifications ──
  const [notifs, setNotifs] = useState({
    lowStock:         true,
    outOfStock:       true,
    dailySummary:     false,
    weeklyReport:     true,
    newCustomer:      false,
    refundProcessed:  true,
  })
  const [lowStockThreshold, setLowStockThreshold] = useState('10')

  // ── Security ──
  const [pin,      setPin]      = useState(['', '', '', ''])
  const [timeout,  setTimeout_] = useState('30min')
  const [twoFA,    setTwoFA]    = useState(false)

  // ── System ──
  const [cloudBackup, setCloudBackup]     = useState(true)
  const [showResetModal, setShowResetModal] = useState(false)

  const handleSave = () => {
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  // ── Receipt preview ──────────────────────────────────────────────────────
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
      {showCashier && (
        <div className="text-neutral-400 mt-2">Cashier: CK Caagbay</div>
      )}
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
              <Field label="Store Name"    value={storeName} onChange={setStoreName} placeholder="Xantara Makati" />
              <Field label="Address"       value={address}   onChange={setAddress}   placeholder="123 Ayala Ave" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone"  value={phone} onChange={setPhone} type="tel"   placeholder="02-8123-4567"    />
                <Field label="Email"  value={email} onChange={setEmail} type="email" placeholder="store@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                  Currency
                </label>
                <select className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-brand-600">
                  <option>PHP — Philippine Peso (₱)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                  Logo
                </label>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6
                  flex flex-col items-center justify-center gap-2 hover:border-brand-400
                  hover:bg-brand-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span className="text-white font-black text-lg">B</span>
                  </div>
                  <p className="text-xs text-neutral-500">Click to upload or drag & drop</p>
                  <p className="text-[10px] text-neutral-400">PNG, JPG up to 2MB</p>
                </div>
              </div>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm
                  font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── BRANCHES ── */}
          {tab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-800">Branch Management</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  bg-brand-600 text-white rounded-lg hover:bg-brand-800 transition-colors">
                  <span>+</span> Add Branch
                </button>
              </div>
              <div className="space-y-3">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-800">{b.name}</div>
                      <div className="text-xs text-neutral-400">{b.address} · {b.cashiers} cashiers</div>
                    </div>
                    <Toggle checked={b.active}
                      onChange={(v) => setBranches((prev) => prev.map((x) => x.id === b.id ? { ...x, active: v } : x))}
                    />
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-white text-neutral-400 hover:text-brand-600 transition-colors text-xs">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                    <Toggle checked={payMethods[key]}
                      onChange={(v) => setPayMethods((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
              {payMethods.card  && <Field label="Card Processor" value={cardProcessor} onChange={setCardProcessor} placeholder="PayMongo" />}
              {payMethods.gcash && <Field label="GCash Merchant ID" value={gcashId}  onChange={setGcashId}  placeholder="GC-XXXXX" />}
              {payMethods.maya  && <Field label="Maya Merchant ID"  value={mayaId}   onChange={setMayaId}   placeholder="MAYA-XXXXX" />}
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600
                text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
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
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    Header Text
                  </label>
                  <textarea rows={3} value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                    Footer Text
                  </label>
                  <input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                {([
                  { key: 'autoPrint',    label: 'Auto-print on checkout',  val: autoPrint,    set: setAutoPrint    },
                  { key: 'emailReceipt', label: 'Send email receipt',       val: emailReceipt, set: setEmailReceipt },
                  { key: 'showVAT',      label: 'Show VAT breakdown',        val: showVAT,      set: setShowVAT      },
                  { key: 'showCashier',  label: 'Show cashier name',         val: showCashier,  set: setShowCashier  },
                ] as const).map(({ key, label, val, set }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{label}</span>
                    <Toggle checked={val} onChange={set} />
                  </div>
                ))}
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600
                  text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                  {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
                </button>
              </div>
              {/* Live preview */}
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                  Receipt Preview
                </p>
                <ReceiptPreview />
              </div>
            </div>
          )}

          {/* ── TAXES ── */}
          {tab === 'taxes' && (
            <div className="space-y-5 max-w-sm">
              <h2 className="text-sm font-bold text-neutral-800">Tax Settings</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                  VAT Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} min="0" max="100"
                    className="w-28 px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
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
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600
                text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
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
                      <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)}
                        min="1" max="100"
                        className="w-16 px-2 py-1 text-xs border border-neutral-200 rounded-md
                          focus:outline-none focus:ring-1 focus:ring-brand-600"
                      />
                      <span className="text-xs text-neutral-400">units</span>
                    </div>
                  </div>
                  <Toggle checked={notifs.lowStock} onChange={(v) => setNotifs((n) => ({ ...n, lowStock: v }))} />
                </div>
                {([
                  { key: 'outOfStock',      label: 'Out of stock alerts',        desc: 'When a product reaches 0 units'    },
                  { key: 'dailySummary',    label: 'Daily sales summary email',  desc: 'Sent every day at 11:59 PM'       },
                  { key: 'weeklyReport',    label: 'Weekly report email',        desc: 'Sent every Monday morning'        },
                  { key: 'newCustomer',     label: 'New customer registered',    desc: 'When a new customer is added'     },
                  { key: 'refundProcessed', label: 'Refund processed',           desc: 'When a refund is issued'          },
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
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600
                text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                {savedMsg ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-sm font-bold text-neutral-800">Security Settings</h2>
              {/* PIN */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                  Change PIN
                </label>
                <div className="flex items-center gap-3">
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const v   = e.target.value.replace(/\D/g, '').slice(-1)
                        const next = [...pin]
                        next[i]  = v
                        setPin(next)
                        if (v && i < 3) {
                          const inputs = document.querySelectorAll<HTMLInputElement>('.pin-input')
                          inputs[i + 1]?.focus()
                        }
                      }}
                      className="pin-input w-12 h-12 text-center text-lg font-bold border border-neutral-200
                        rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  ))}
                  <button
                    onClick={() => setPin(['', '', '', ''])}
                    className="text-xs text-neutral-400 hover:text-neutral-600">
                    Clear
                  </button>
                </div>
              </div>
              {/* Session timeout */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                  Session Timeout
                </label>
                <select value={timeout} onChange={(e) => setTimeout_(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-brand-600">
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hr">1 hour</option>
                  <option value="never">Never</option>
                </select>
              </div>
              {/* 2FA */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Two-Factor Authentication</div>
                  <div className="text-xs text-neutral-400">Require OTP on login</div>
                </div>
                <Toggle checked={twoFA} onChange={setTwoFA} />
              </div>
              {/* Active sessions */}
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                  Active Sessions
                </div>
                <div className="space-y-2">
                  {[
                    { device: 'Chrome on Windows', location: 'Makati, PH', active: 'Just now',     current: true  },
                    { device: 'Safari on iPhone',  location: 'Makati, PH', active: '2 hours ago',  current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <div>
                        <div className="text-xs font-semibold text-neutral-800">
                          {s.device} {s.current && <span className="text-brand-600">(this device)</span>}
                        </div>
                        <div className="text-[10px] text-neutral-400">{s.location} · {s.active}</div>
                      </div>
                      {!s.current && (
                        <button className="text-xs text-danger-600 font-semibold hover:underline">Revoke</button>
                      )}
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
              {/* Sync status */}
              <div className="flex items-center gap-3 p-4 bg-success-50 rounded-xl border border-success-600/20">
                <div className="w-2.5 h-2.5 rounded-full bg-success-600" />
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Synced</div>
                  <div className="text-xs text-neutral-400">Last sync: May 24, 2026 · 9:41 AM</div>
                </div>
                <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
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
                <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                  Export All Data
                </button>
                <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                  Clear Cache
                </button>
              </div>
              <div className="text-xs text-neutral-400">App version: v1.0.0</div>
              {/* Danger zone */}
              <div className="border border-danger-600/30 rounded-xl p-4 space-y-3">
                <div className="text-sm font-bold text-danger-600">Danger Zone</div>
                <div className="text-xs text-neutral-500">
                  Resetting will permanently delete all local data. This cannot be undone.
                </div>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-danger-600
                    border border-danger-600/30 rounded-lg hover:bg-danger-50 transition-colors">
                  Reset All Data
                </button>
              </div>
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
    </div>
  )
}
