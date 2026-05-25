'use client'

// TODO: Replace MOCK_DATA with API call → GET /api/staff

import { useState, useEffect } from 'react'
import {
  Search, Plus, Pencil, Trash2, Eye, ShieldCheck, Clock,
} from 'lucide-react'
import { type Staff, type StaffRole, type StaffStatus } from '@/lib/mock/staff'
import { usePOS }       from '@/context/POSContext'
import { useAuth }      from '@/context/AuthContext'
import Badge            from '@/components/shared/Badge'
import EmptyState       from '@/components/shared/EmptyState'
import DrawerModal      from '@/components/shared/DrawerModal'
import ConfirmModal     from '@/components/shared/ConfirmModal'
import Pagination       from '@/components/shared/Pagination'

const PAGE_SIZE = 10

const ROLES: StaffRole[]   = ['Admin', 'Manager', 'Cashier', 'Stock Clerk']
const BRANCHES             = ['Makati', 'BGC', 'Quezon']
const STATUSES: StaffStatus[] = ['Active', 'Inactive', 'On Leave']

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

const ROLE_VARIANT: Record<StaffRole, 'info' | 'success' | 'neutral' | 'warning'> = {
  Admin:        'info',
  Manager:      'success',
  Cashier:      'neutral',
  'Stock Clerk':'warning',
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', role: 'Cashier' as StaffRole,
  branch: 'Makati', status: 'Active' as StaffStatus, password: '',
}
type FormState = typeof EMPTY_FORM

export default function StaffPage() {
  const { staff, setStaff, transactions } = usePOS()
  const { user }                          = useAuth()

  const [search,       setSearch]       = useState('')
  const [roleFlt,      setRoleFlt]      = useState('All')
  const [branchFlt,    setBranchFlt]    = useState('All')
  const [statusFlt,    setStatusFlt]    = useState('All')
  const [page,         setPage]         = useState(1)

  const [viewTarget,   setViewTarget]   = useState<Staff | null>(null)
  const [editTarget,   setEditTarget]   = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [isAddOpen,    setIsAddOpen]    = useState(false)
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
  const [showPw,       setShowPw]       = useState(false)

  // ── Stats ──
  const activeNow   = staff.filter((s) => s.status === 'Active').length
  const onLeave     = staff.filter((s) => s.status === 'On Leave').length
  const topPerf     = [...staff].sort((a, b) => b.salesCount - a.salesCount)[0]

  // ── Filter ──
  const filtered = staff
    .filter((s) =>
      search
        ? s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .filter((s) => roleFlt   !== 'All' ? s.role   === roleFlt   : true)
    .filter((s) => branchFlt !== 'All' ? s.branch === branchFlt : true)
    .filter((s) => statusFlt !== 'All' ? s.status === statusFlt : true)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [search, roleFlt, branchFlt, statusFlt])

  // ── CRUD ──
  const handleAdd = () => {
    setStaff((prev) => [{
      id: `s${Date.now()}`, name: form.name, email: form.email, phone: form.phone,
      role: form.role, branch: form.branch, status: form.status,
      joinedAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0],
      salesCount: 0, avatar: form.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
    }, ...prev])
    setIsAddOpen(false)
    setForm(EMPTY_FORM)
  }

  const handleEdit = () => {
    if (!editTarget) return
    setStaff((prev) => prev.map((s) =>
      s.id === editTarget.id
        ? { ...s, name: form.name, email: form.email, phone: form.phone,
            role: form.role, branch: form.branch, status: form.status }
        : s
    ))
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const toggleStatus = (s: Staff) => {
    const next: StaffStatus = s.status === 'Active' ? 'Inactive' : 'Active'
    setStaff((prev) => prev.map((x) => x.id === s.id ? { ...x, status: next } : x))
  }

  const openEdit = (s: Staff) => {
    setEditTarget(s)
    setForm({ name: s.name, email: s.email, phone: s.phone,
              role: s.role, branch: s.branch, status: s.status, password: '' })
  }

  const staffTxns = (name: string) =>
    transactions.filter((t) => t.cashier === name).sort((a, b) => b.txnNo.localeCompare(a.txnNo))

  const FormFields = ({ state, onChange, isEdit = false }: {
    state: FormState
    onChange: (f: FormState) => void
    isEdit?: boolean
  }) => (
    <div className="px-6 py-5 space-y-4">
      {([
        { key: 'name',  label: 'Full Name *',  type: 'text',  placeholder: 'Ana Reyes'      },
        { key: 'email', label: 'Email *',       type: 'email', placeholder: 'ana@xantara.com'},
        { key: 'phone', label: 'Phone',         type: 'tel',   placeholder: '09XXXXXXXXX'   },
      ] as const).map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">{label}</label>
          <input type={type} placeholder={placeholder} value={state[key]}
            onChange={(e) => onChange({ ...state, [key]: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Role *</label>
          <select value={state.role} onChange={(e) => onChange({ ...state, role: e.target.value as StaffRole })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600">
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Branch *</label>
          <select value={state.branch} onChange={(e) => onChange({ ...state, branch: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600">
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Status</label>
        <select value={state.status} onChange={(e) => onChange({ ...state, status: e.target.value as StaffStatus })}
          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-brand-600">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
            Temporary Password *
          </label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters"
              value={state.password}
              onChange={(e) => onChange({ ...state, password: e.target.value })}
              className="w-full px-3 py-2.5 pr-10 text-sm border border-neutral-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <button type="button" onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Staff Management</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your team members</p>
        </div>
        {user?.role === 'Admin' && (
          <button onClick={() => { setForm(EMPTY_FORM); setIsAddOpen(true) }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white
              text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: 'Total Staff',    value: String(staff.length), sub: 'all branches',          color: 'text-neutral-400' },
          { label: 'Active Now',     value: String(activeNow),    sub: 'currently working',     color: 'text-success-600' },
          { label: 'On Leave',       value: String(onLeave),      sub: 'temporarily away',      color: 'text-warning-600' },
          { label: 'Top Performer',  value: topPerf?.avatar ?? '—', sub: `${topPerf?.salesCount ?? 0} sales · ${topPerf?.name ?? ''}`, color: 'text-brand-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{s.label}</span>
            <div className="text-2xl font-bold text-neutral-800 mt-3">{s.value}</div>
            <div className={`text-xs mt-1 truncate ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-neutral-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', ...ROLES].map((r) => (
            <button key={r} onClick={() => setRoleFlt(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors
                ${roleFlt === r ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {r}
            </button>
          ))}
        </div>
        <select value={branchFlt} onChange={(e) => setBranchFlt(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
            text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
          <option value="All">All Branches</option>
          {BRANCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          {['All','Active','Inactive','On Leave'].map((s) => (
            <button key={s} onClick={() => setStatusFlt(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors
                ${statusFlt === s ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {['Staff','Role','Branch','Status','Sales','Last Login',''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((s) => (
              <tr key={s.id}
                className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                onClick={() => setViewTarget(s)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center
                      text-brand-600 text-xs font-bold flex-shrink-0">
                      {s.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-800">{s.name}</div>
                      <div className="text-[10px] text-neutral-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[s.role]}>{s.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600">{s.branch}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === 'Active' ? 'success' : s.status === 'On Leave' ? 'warning' : 'neutral'}>
                    {s.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600">
                    {s.salesCount > 0 ? s.salesCount : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {relativeTime(s.lastLogin)}
                  </div>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewTarget(s)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEdit(s)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(s)}
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

        {paginated.length === 0 && (
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6 text-brand-600" />}
            title="No staff found"
            description="Try adjusting your search or filters"
          />
        )}

        {filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages}
            totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {/* ── Staff profile drawer ── */}
      <DrawerModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Staff Profile"
        footer={
          <div className="px-6 py-4 flex gap-3">
            <button onClick={() => { if (viewTarget) openEdit(viewTarget); setViewTarget(null) }}
              className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
              Edit
            </button>
            {viewTarget && (
              <button onClick={() => { toggleStatus(viewTarget); setViewTarget(null) }}
                className="py-2.5 px-4 text-sm font-semibold text-warning-600
                  border border-warning-600/30 rounded-lg hover:bg-warning-50 transition-colors">
                {viewTarget.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        }
      >
        {viewTarget && (
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-50 border-2 border-brand-100
                flex items-center justify-center text-brand-600 text-base font-bold">
                {viewTarget.avatar}
              </div>
              <div>
                <div className="text-base font-bold text-neutral-800">{viewTarget.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={ROLE_VARIANT[viewTarget.role]}>{viewTarget.role}</Badge>
                  <Badge variant={viewTarget.status === 'Active' ? 'success' : viewTarget.status === 'On Leave' ? 'warning' : 'neutral'}>
                    {viewTarget.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Branch',     value: viewTarget.branch },
                { label: 'Sales',      value: viewTarget.salesCount > 0 ? String(viewTarget.salesCount) : '—' },
                { label: 'Joined',     value: new Date(viewTarget.joinedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Last Login', value: relativeTime(viewTarget.lastLogin) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wide">{label}</div>
                  <div className="text-sm font-bold text-neutral-800 mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>{viewTarget.email}</div>
              <div>{viewTarget.phone}</div>
            </div>
            {staffTxns(viewTarget.name).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                  Recent Activity
                </div>
                <div className="space-y-2">
                  {staffTxns(viewTarget.name).slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-brand-600">{t.txnNo}</span>
                      <span className="text-neutral-400">{t.date} {t.time}</span>
                      <span className="font-semibold text-neutral-800">₱{t.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DrawerModal>

      {/* ── Add drawer ── */}
      <DrawerModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Staff Member"
        footer={
          <div className="px-6 py-4 flex gap-3">
            <button onClick={() => setIsAddOpen(false)}
              className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">Cancel</button>
            <button onClick={handleAdd}
              disabled={!form.name || !form.email}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Add Staff
            </button>
          </div>
        }
      >
        <FormFields state={form} onChange={setForm} />
      </DrawerModal>

      {/* ── Edit drawer ── */}
      <DrawerModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Staff Member"
        footer={
          <div className="px-6 py-4 flex gap-3">
            <button onClick={() => setEditTarget(null)}
              className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">Cancel</button>
            <button onClick={handleEdit}
              disabled={!form.name || !form.email}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Save Changes
            </button>
          </div>
        }
      >
        <FormFields state={form} onChange={setForm} isEdit />
      </DrawerModal>

      {/* ── Delete confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove staff member?"
        message={
          <><span className="font-semibold text-neutral-600">{deleteTarget?.name}</span> will be removed from the system.</>
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  )
}
