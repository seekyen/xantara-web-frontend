'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Star, Mail, Phone, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
  type Customer, type CustomerStatus,
  createCustomer, updateCustomer,
} from '@/lib/api/customers'
import { type LoyaltyEntry, getCustomerLoyalty } from '@/lib/api/loyalty'
import { usePOS }      from '@/context/POSContext'
import LoyaltyProgramPanel from '@/components/customers/LoyaltyProgramPanel'
import Badge           from '@/components/shared/Badge'
import EmptyState      from '@/components/shared/EmptyState'
import DrawerModal     from '@/components/shared/DrawerModal'
import ConfirmModal    from '@/components/shared/ConfirmModal'
import Pagination      from '@/components/shared/Pagination'

const PAGE_SIZE = 10

const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined

function fmt(n: number) { return `₱${Number(n).toLocaleString('en-PH')}` }

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const parts    = name.split(' ')
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  const cls = size === 'lg' ? 'w-14 h-14 text-base' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div className={`${cls} rounded-full bg-brand-50 border-2 border-brand-100
      flex items-center justify-center font-bold text-brand-600 flex-shrink-0 uppercase`}>
      {initials.toUpperCase()}
    </div>
  )
}

const EMPTY_FORM = { name: '', email: '', phone: '', status: 'active' as CustomerStatus }
type FormState   = typeof EMPTY_FORM

function CustomerFormFields({ state, onChange }: {
  state: FormState
  onChange: (form: FormState) => void
}) {
  return (
    <div className="px-6 py-5 space-y-4">
      {([
        { key: 'name',  label: 'Full Name *', type: 'text',  placeholder: 'Maria Santos' },
        { key: 'email', label: 'Email',       type: 'email', placeholder: 'maria@email.com' },
        { key: 'phone', label: 'Phone',       type: 'tel',   placeholder: '09XXXXXXXXX' },
      ] as const).map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
            {label}
          </label>
          <input type={type} placeholder={placeholder} value={state[key]}
            onChange={(event) => onChange({ ...state, [key]: event.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
          Status
        </label>
        <select value={state.status}
          onChange={(event) => onChange({ ...state, status: event.target.value as CustomerStatus })}
          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-brand-600">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { customers, setCustomers, customersLoading, transactions } = usePOS()

  const [search,    setSearch]    = useState('')
  const [statusFlt, setStatusFlt] = useState<'All' | CustomerStatus>('All')
  const [sortBy,    setSortBy]    = useState('most-spent')
  const [page,      setPage]      = useState(1)

  const [viewTarget,   setViewTarget]   = useState<Customer | null>(null)
  const [editTarget,   setEditTarget]   = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [isAddOpen,    setIsAddOpen]    = useState(false)
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
  const [isSaving,     setIsSaving]     = useState(false)
  const [formError,    setFormError]    = useState('')
  const [history, setHistory] = useState<{ id: number; rows: LoyaltyEntry[] } | null>(null)

  // Points ledger for the customer shown in the drawer (earned and reversed, newest first);
  // `null` while it loads or when the loaded rows belong to a previously opened customer.
  const viewId = viewTarget?.id
  useEffect(() => {
    if (viewId === undefined) return
    let cancelled = false
    getCustomerLoyalty(viewId, authToken())
      .then((rows) => { if (!cancelled) setHistory({ id: viewId, rows }) })
      .catch(() => { if (!cancelled) setHistory({ id: viewId, rows: [] }) })
    return () => { cancelled = true }
  }, [viewId])
  const pointsHistory = history && history.id === viewId ? history.rows : null

  // ── Stats ──
  const activeCount  = customers.filter((c) => c.status === 'active').length
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const newThisMonth = customers.filter((c) => new Date(c.joined_at) >= startOfMonth).length
  const avgLTV       = customers.length
    ? Math.round(customers.reduce((s, c) => s + Number(c.total_spent), 0) / customers.length)
    : 0

  // ── Filter + sort ──
  const filtered = customers
    .filter((c) =>
      search
        ? c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
        : true
    )
    .filter((c) => statusFlt !== 'All' ? c.status === statusFlt : true)
    .sort((a, b) => {
      if (sortBy === 'most-spent')  return Number(b.total_spent) - Number(a.total_spent)
      if (sortBy === 'most-orders') return b.total_orders - a.total_orders
      if (sortBy === 'recent')      return (b.last_visit ?? '').localeCompare(a.last_visit ?? '')
      if (sortBy === 'newest')      return b.joined_at.localeCompare(a.joined_at)
      return 0
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── CRUD ──
  const handleAdd = async () => {
    setIsSaving(true); setFormError('')
    try {
      const created = await createCustomer(
        { name: form.name, email: form.email || undefined, phone: form.phone, status: form.status },
        authToken(),
      )
      setCustomers((prev) => [created, ...prev])
      setIsAddOpen(false)
      setForm(EMPTY_FORM)
    } catch {
      setFormError('Could not add customer. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setIsSaving(true); setFormError('')
    try {
      const updated = await updateCustomer(
        editTarget.id,
        { name: form.name, email: form.email || undefined, phone: form.phone, status: form.status },
        authToken(),
      )
      setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      setEditTarget(null)
    } catch {
      setFormError('Could not save changes. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // "Deactivate" flips status rather than hard-deleting — customers are referenced by
  // transaction history (Transaction.customer), so removing the row outright would
  // orphan that history instead of just hiding the customer going forward.
  const handleDeactivate = async () => {
    if (!deleteTarget) return
    setIsSaving(true)
    try {
      const updated = await updateCustomer(deleteTarget.id, { status: 'inactive' }, authToken())
      setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      setDeleteTarget(null)
    } catch {
      // Swallow — ConfirmModal has no error slot; the customer simply stays active
      // and the user can retry.
    } finally {
      setIsSaving(false)
    }
  }

  const openEdit = (c: Customer) => {
    setEditTarget(c)
    setFormError('')
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone, status: c.status })
  }

  // ── Customer txn history (from the transactions already loaded into POSContext) ──
  const custTxns = (id: number) =>
    transactions.filter((t) => t.customer === id).sort((a, b) => b.txn_no.localeCompare(a.txn_no))

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Customers</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your customer base</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setIsAddOpen(true) }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white
            text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: 'Total Customers', value: String(customers.length),  sub: 'all time',           color: 'text-neutral-400' },
          { label: 'Active',          value: String(activeCount),        sub: 'currently active',   color: 'text-success-600' },
          { label: 'New This Month',  value: String(newThisMonth),       sub: 'joined this month',  color: 'text-brand-600'   },
          { label: 'Avg. Lifetime',   value: fmt(avgLTV),                sub: 'average spent',      color: 'text-neutral-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{s.label}</span>
            <div className="text-2xl font-bold text-neutral-800 mt-3">{s.value}</div>
            <div className={`text-xs mt-1 ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Loyalty program: earning rate and promo periods ── */}
      <LoyaltyProgramPanel />

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search name, email, or phone…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-neutral-400"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['All','active','inactive'] as const).map((s) => (
            <button key={s} onClick={() => { setStatusFlt(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors
                ${statusFlt === s ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-400">Sort by</span>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
              text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
            <option value="most-spent">Most Spent</option>
            <option value="most-orders">Most Orders</option>
            <option value="recent">Recently Active</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {['Customer','Email','Phone','Orders','Total Spent','Loyalty','Last Visit','Status',''].map((h) => (
                <th key={h}
                  className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wide
                    ${h === 'Total Spent' ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((c) => (
              <tr key={c.id}
                className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                onClick={() => setViewTarget(c)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Initials name={c.name} />
                    <div>
                      <div className="text-sm font-semibold text-neutral-800">{c.name}</div>
                      <div className="text-[10px] text-neutral-400">since {formatDate(c.joined_at)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <Mail className="w-3 h-3" />{c.email ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <Phone className="w-3 h-3" />{c.phone || '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-neutral-800">{c.total_orders}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-brand-600">{fmt(c.total_spent)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-success-600">
                    <Star className="w-3 h-3 fill-success-600" />
                    <span className="text-xs font-semibold">{c.loyalty_points}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-neutral-600">{formatDate(c.last_visit)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>{c.status_display}</Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(c)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-danger-50 text-neutral-400 hover:text-danger-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customersLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading customers…</span>
          </div>
        )}

        {!customersLoading && paginated.length === 0 && (
          <EmptyState
            icon={<Search className="w-6 h-6 text-brand-600" />}
            title="No customers found"
            description="Try adjusting your search or filters"
          />
        )}

        {filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages}
            totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {/* ── View drawer ── */}
      <DrawerModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Customer Details"
        footer={
          <div className="px-6 py-4 flex gap-3">
            <button
              onClick={() => { if (viewTarget) openEdit(viewTarget); setViewTarget(null) }}
              className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
              Edit
            </button>
            <button
              onClick={() => { if (viewTarget) setDeleteTarget(viewTarget); setViewTarget(null) }}
              className="py-2.5 px-4 text-sm font-semibold text-danger-600
                border border-danger-600/30 rounded-lg hover:bg-danger-50 transition-colors">
              Deactivate
            </button>
          </div>
        }
      >
        {viewTarget && (
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center gap-4">
              <Initials name={viewTarget.name} size="lg" />
              <div>
                <div className="text-base font-bold text-neutral-800">{viewTarget.name}</div>
                <div className="text-xs text-neutral-400">Member since {formatDate(viewTarget.joined_at)}</div>
                <Badge variant={viewTarget.status === 'active' ? 'success' : 'neutral'} className="mt-1">
                  {viewTarget.status_display}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Spent',    value: fmt(viewTarget.total_spent)   },
                { label: 'Total Orders',   value: String(viewTarget.total_orders) },
                { label: 'Loyalty Points', value: `${viewTarget.loyalty_points} pts` },
                { label: 'Last Visit',     value: formatDate(viewTarget.last_visit) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wide">{label}</div>
                  <div className="text-sm font-bold text-neutral-800 mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Contact
              </div>
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{viewTarget.email ?? '—'}</div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{viewTarget.phone || '—'}</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Purchase History
              </div>
              {custTxns(viewTarget.id).length === 0 ? (
                <p className="text-xs text-neutral-400">No transactions linked.</p>
              ) : (
                <div className="space-y-2">
                  {custTxns(viewTarget.id).slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-brand-600">{t.txn_no}</span>
                        <span className="text-neutral-400 ml-2">{formatDate(t.created_at)}</span>
                      </div>
                      <span className="font-semibold text-neutral-800">{fmt(t.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Points History
              </div>
              {pointsHistory === null ? (
                <p className="text-xs text-neutral-400">Loading…</p>
              ) : pointsHistory.length === 0 ? (
                <p className="text-xs text-neutral-400">No points earned yet.</p>
              ) : (
                <div className="space-y-2">
                  {pointsHistory.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-brand-600">{entry.txn_no ?? '—'}</span>
                        <span className="text-neutral-400 ml-2">{formatDate(entry.created_at)}</span>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {entry.kind === 'reversal' ? 'Refund' : `${fmt(Number(entry.net_amount))} excl. VAT`}
                          {entry.kind === 'earn' && entry.promo_name && ` · ${entry.promo_name} (${fmt(Number(entry.spend_per_point))} = 1 pt)`}
                        </div>
                      </div>
                      <span className={`font-semibold whitespace-nowrap ${entry.points < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                        {entry.points > 0 ? '+' : '−'}{Math.abs(entry.points)} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerModal>

      {/* ── Add drawer ── */}
      <DrawerModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Customer"
        footer={
          <div className="px-6 py-4 flex flex-col gap-2">
            {formError && <p className="text-xs text-danger-600">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setIsAddOpen(false)} disabled={isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button onClick={handleAdd}
                disabled={!form.name || isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                  rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Customer
              </button>
            </div>
          </div>
        }
      >
        <CustomerFormFields state={form} onChange={setForm} />
      </DrawerModal>

      {/* ── Edit drawer ── */}
      <DrawerModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Customer"
        footer={
          <div className="px-6 py-4 flex flex-col gap-2">
            {formError && <p className="text-xs text-danger-600">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setEditTarget(null)} disabled={isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button onClick={handleEdit}
                disabled={!form.name || isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                  rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        }
      >
        <CustomerFormFields state={form} onChange={setForm} />
      </DrawerModal>

      {/* ── Deactivate confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate customer?"
        message={
          <><span className="font-semibold text-neutral-600">{deleteTarget?.name}</span> will be marked inactive. Their purchase history is kept.</>
        }
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  )
}
