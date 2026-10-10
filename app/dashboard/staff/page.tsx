'use client'

import { useEffect, useState } from 'react'
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, KeyRound, ShieldCheck, Clock, Loader2,
} from 'lucide-react'
import {
  type Staff, type StaffRole, type StaffStatus, STAFF_ROLES, STAFF_STATUSES,
  createStaff, updateStaff, deleteStaff, toggleStaffStatus, resetStaffPassword,
} from '@/lib/api/staff'
import { type Branch, getAllBranches } from '@/lib/api/branches'
import { ApiError } from '@/lib/api/client'
import { usePOS }       from '@/context/POSContext'
import { useAuth }      from '@/context/AuthContext'
import Badge            from '@/components/shared/Badge'
import EmptyState       from '@/components/shared/EmptyState'
import DrawerModal      from '@/components/shared/DrawerModal'
import StaffDialogModal from '@/components/shared/StaffDialogModal'
import ConfirmModal     from '@/components/shared/ConfirmModal'
import Pagination       from '@/components/shared/Pagination'

const PAGE_SIZE = 10

const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined

function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  const body = error.body as Record<string, unknown>
  if (typeof body?.detail === 'string') return body.detail
  const first = Object.values(body ?? {})[0]
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  return `${fallback} (HTTP ${error.status})`
}

function relativeTime(iso: string | null) {
  if (!iso) return 'Never'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

const ROLE_VARIANT: Record<StaffRole, 'info' | 'success' | 'neutral' | 'warning'> = {
  admin:       'info',
  manager:     'success',
  cashier:     'neutral',
  stock_clerk: 'warning',
}

const STATUS_VARIANT: Record<StaffStatus, 'success' | 'warning' | 'neutral'> = {
  active:   'success',
  on_leave: 'warning',
  inactive: 'neutral',
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', role: 'cashier' as StaffRole,
  branch: '' as number | '', status: 'active' as StaffStatus, password: '',
}
type FormState = typeof EMPTY_FORM

function StaffFormFields({ state, onChange, branches, isEdit = false, showPassword, onTogglePassword }: {
  state: FormState
  onChange: (form: FormState) => void
  branches: Branch[]
  isEdit?: boolean
  showPassword: boolean
  onTogglePassword: () => void
}) {
  const roleHint = STAFF_ROLES.find((r) => r.value === state.role)?.hint
  return (
    <div className="px-6 py-5 space-y-4">
      {([
        { key: 'name',  label: 'Full Name *', type: 'text' },
        { key: 'email', label: 'Email *',      type: 'email' },
        { key: 'phone', label: 'Phone',        type: 'tel' },
      ] as const).map(({ key, label, type }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">{label}</label>
          <input type={type} value={state[key]}
            onChange={(event) => onChange({ ...state, [key]: event.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Role — access level *</label>
          <select value={state.role}
            onChange={(event) => onChange({ ...state, role: event.target.value as StaffRole })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600">
            {STAFF_ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Branch</label>
          <select value={state.branch}
            onChange={(event) => onChange({ ...state, branch: event.target.value ? Number(event.target.value) : '' })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-600">
            <option value="">Unassigned</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      {roleHint && <p className="text-xs text-neutral-400 -mt-2">{roleHint}</p>}
      <div>
        <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Status</label>
        <select value={state.status}
          onChange={(event) => onChange({ ...state, status: event.target.value as StaffStatus })}
          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-brand-600">
          {STAFF_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
            Temporary Password *
          </label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'}
              value={state.password}
              onChange={(event) => onChange({ ...state, password: event.target.value })}
              className="w-full px-3 py-2.5 pr-10 text-sm border border-neutral-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <button type="button" onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffPage() {
  const { staff, setStaff, staffLoading, transactions } = usePOS()
  const { user }                                        = useAuth()

  const isAdmin        = user?.role === 'admin'
  const canEditStaff   = user?.role === 'admin' || user?.role === 'manager'

  const [branches,     setBranches]     = useState<Branch[]>([])

  useEffect(() => {
    let cancelled = false
    getAllBranches(authToken()).then((all) => { if (!cancelled) setBranches(all) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const [search,       setSearch]       = useState('')
  const [roleFlt,      setRoleFlt]      = useState<'All' | StaffRole>('All')
  const [branchFlt,    setBranchFlt]    = useState<'All' | number>('All')
  const [statusFlt,    setStatusFlt]    = useState<'All' | StaffStatus>('All')
  const [page,         setPage]         = useState(1)

  const [viewTarget,   setViewTarget]   = useState<Staff | null>(null)
  const [editTarget,   setEditTarget]   = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [isAddOpen,    setIsAddOpen]    = useState(false)
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
  const [showPw,       setShowPw]       = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [formError,    setFormError]    = useState('')
  const [passwordTarget, setPasswordTarget] = useState<Staff | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // ── Stats ──
  const activeNow   = staff.filter((s) => s.status === 'active').length
  const onLeave     = staff.filter((s) => s.status === 'on_leave').length
  const topPerf     = [...staff].sort((a, b) => b.sales_count - a.sales_count)[0]

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

  // ── CRUD ──
  const handleAdd = async () => {
    setIsSaving(true); setFormError('')
    try {
      const created = await createStaff({
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, branch: form.branch === '' ? null : form.branch,
        status: form.status, password: form.password,
      }, authToken())
      setStaff((prev) => [created, ...prev])
      setIsAddOpen(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not add staff member. Please check your connection and try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setIsSaving(true); setFormError('')
    try {
      const updated = await updateStaff(editTarget.id, {
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, branch: form.branch === '' ? null : form.branch,
        status: form.status,
      }, authToken())
      setStaff((prev) => prev.map((s) => s.id === updated.id ? updated : s))
      setEditTarget(null)
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not save changes. Please check your connection and try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteStaff(deleteTarget.id, authToken())
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    } catch {
      // ConfirmModal has no error slot — the staff member simply stays and the user can retry.
    } finally {
      setDeleteTarget(null)
    }
  }

  const toggleStatus = async (s: Staff) => {
    const next: StaffStatus = s.status === 'active' ? 'inactive' : 'active'
    try {
      await toggleStaffStatus(s.id, next, authToken())
      setStaff((prev) => prev.map((x) => x.id === s.id ? { ...x, status: next } : x))
    } catch {
      // Leave status unchanged on failure.
    }
  }

  const openEdit = (s: Staff) => {
    setEditTarget(s)
    setFormError('')
    setForm({ name: s.name, email: s.email, phone: s.phone,
              role: s.role, branch: s.branch ?? '', status: s.status, password: '' })
  }

  const openPasswordReset = (s: Staff) => {
    setPasswordTarget(s)
    setNewPassword('')
    setConfirmPassword('')
    setShowResetPassword(false)
    setPasswordError('')
    setPasswordSuccess(false)
  }

  const closePasswordReset = () => {
    if (passwordSaving) return
    setPasswordTarget(null)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess(false)
  }

  const handlePasswordReset = async () => {
    if (!passwordTarget) return
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordSaving(true)
    setPasswordError('')
    try {
      await resetStaffPassword(passwordTarget.id, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      }, authToken())
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
    } catch (error) {
      setPasswordError(apiErrorMessage(error, 'Could not change the password. Please try again.'))
    } finally {
      setPasswordSaving(false)
    }
  }

  const staffTxns = (id: number) =>
    transactions.filter((t) => t.cashier === id).sort((a, b) => b.txn_no.localeCompare(a.txn_no))

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Staff Management</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your team, per-branch assignment, and access level</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setIsAddOpen(true) }}
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
          { label: 'Top Performer',  value: topPerf?.initials ?? '—', sub: `${topPerf?.sales_count ?? 0} sales · ${topPerf?.name ?? ''}`, color: 'text-brand-600' },
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
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200
              rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-neutral-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All', ...STAFF_ROLES.map((r) => r.value)] as const).map((r) => (
            <button key={r} onClick={() => { setRoleFlt(r); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors
                ${roleFlt === r ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {r === 'All' ? 'All' : STAFF_ROLES.find((x) => x.value === r)?.label}
            </button>
          ))}
        </div>
        <select value={branchFlt} onChange={(e) => { setBranchFlt(e.target.value ? Number(e.target.value) : 'All'); setPage(1) }}
          className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg
            text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600">
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          {(['All', ...STAFF_STATUSES.map((s) => s.value)] as const).map((s) => (
            <button key={s} onClick={() => { setStatusFlt(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors
                ${statusFlt === s ? 'bg-brand-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {s === 'All' ? 'All' : STAFF_STATUSES.find((x) => x.value === s)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {['Staff','Role','Branch','Status','Sales','Last Login','Actions'].map((h) => (
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
                      {s.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-800">{s.name}</div>
                      <div className="text-[10px] text-neutral-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[s.role]}>{s.role_display}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600">{s.branch_detail?.name ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[s.status]}>{s.status_display}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600">
                    {s.sales_count > 0 ? s.sales_count : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-neutral-400" suppressHydrationWarning>
                    <Clock className="w-3 h-3" />
                    {relativeTime(s.last_login_at)}
                  </div>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewTarget(s)}
                      className="w-7 h-7 rounded-md flex items-center justify-center
                        hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canEditStaff && (
                      <button onClick={() => openEdit(s)}
                        className="w-7 h-7 rounded-md flex items-center justify-center
                          hover:bg-brand-50 text-neutral-400 hover:text-brand-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => openPasswordReset(s)}
                        aria-label={`Change password for ${s.name}`}
                        title="Change password"
                        className="h-7 rounded-md px-2 flex items-center justify-center gap-1
                          hover:bg-brand-50 text-neutral-500 hover:text-brand-600 transition-colors text-xs font-semibold">
                        <KeyRound className="w-3.5 h-3.5" /> Password
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(s)}
                        className="w-7 h-7 rounded-md flex items-center justify-center
                          hover:bg-danger-50 text-neutral-400 hover:text-danger-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {staffLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading staff…</span>
          </div>
        )}

        {!staffLoading && paginated.length === 0 && (
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
            {isAdmin && viewTarget && (
              <button onClick={() => { openPasswordReset(viewTarget); setViewTarget(null) }}
                className="py-2.5 px-4 text-sm font-semibold text-brand-600
                  border border-brand-600/30 rounded-lg hover:bg-brand-50 transition-colors">
                Change password
              </button>
            )}
            {canEditStaff && (
              <button onClick={() => { if (viewTarget) openEdit(viewTarget); setViewTarget(null) }}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                Edit
              </button>
            )}
            {canEditStaff && viewTarget && (
              <button onClick={() => { toggleStatus(viewTarget); setViewTarget(null) }}
                className="py-2.5 px-4 text-sm font-semibold text-warning-600
                  border border-warning-600/30 rounded-lg hover:bg-warning-50 transition-colors">
                {viewTarget.status === 'active' ? 'Deactivate' : 'Activate'}
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
                {viewTarget.initials}
              </div>
              <div>
                <div className="text-base font-bold text-neutral-800">{viewTarget.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={ROLE_VARIANT[viewTarget.role]}>{viewTarget.role_display}</Badge>
                  <Badge variant={STATUS_VARIANT[viewTarget.status]}>{viewTarget.status_display}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Branch',     value: viewTarget.branch_detail?.name ?? 'Unassigned' },
                { label: 'Sales',      value: viewTarget.sales_count > 0 ? String(viewTarget.sales_count) : '—' },
                { label: 'Joined',     value: viewTarget.joined_at ? new Date(viewTarget.joined_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                { label: 'Last Login', value: relativeTime(viewTarget.last_login_at) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wide">{label}</div>
                  <div className="text-sm font-bold text-neutral-800 mt-0.5"
                    suppressHydrationWarning={label === 'Last Login'}>{value}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>{viewTarget.email}</div>
              <div>{viewTarget.phone || '—'}</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>{viewTarget.has_pin ? 'PIN set' : 'No PIN'}</span>
              <span>·</span>
              <span>{viewTarget.biometric_enabled ? 'Biometric enabled' : 'Biometric off'}</span>
            </div>
            {staffTxns(viewTarget.id).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                  Recent Activity
                </div>
                <div className="space-y-2">
                  {staffTxns(viewTarget.id).slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-brand-600">{t.txn_no}</span>
                      <span className="text-neutral-400">{new Date(t.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      <span className="font-semibold text-neutral-800">₱{Number(t.total).toLocaleString('en-PH')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DrawerModal>

      {/* ── Add dialog ── */}
      <StaffDialogModal
        isOpen={isAddOpen}
        onClose={() => { if (!isSaving) setIsAddOpen(false) }}
        title="Add Staff Member"
        footer={
          <div className="px-6 py-4 flex flex-col gap-2">
            {formError && <p className="text-xs text-danger-600">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setIsAddOpen(false)} disabled={isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">Cancel</button>
              <button onClick={handleAdd}
                disabled={!form.name || !form.email || !form.password || isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600
                  rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Staff
              </button>
            </div>
          </div>
        }
      >
        <StaffFormFields state={form} onChange={setForm} branches={branches} showPassword={showPw}
          onTogglePassword={() => setShowPw((visible) => !visible)} />
      </StaffDialogModal>

      {/* ── Edit dialog ── */}
      <StaffDialogModal
        isOpen={!!editTarget}
        onClose={() => { if (!isSaving) setEditTarget(null) }}
        title="Edit Staff Member"
        footer={
          <div className="px-6 py-4 flex flex-col gap-2">
            {formError && <p className="text-xs text-danger-600">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setEditTarget(null)} disabled={isSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                  bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">Cancel</button>
              <button onClick={handleEdit}
                disabled={!form.name || !form.email || isSaving}
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
        <StaffFormFields state={form} onChange={setForm} branches={branches} isEdit showPassword={showPw}
          onTogglePassword={() => setShowPw((visible) => !visible)} />
      </StaffDialogModal>

      {/* ── Admin password reset dialog ── */}
      <StaffDialogModal
        isOpen={!!passwordTarget}
        onClose={closePasswordReset}
        title="Change Staff Password"
        footer={
          <div className="px-6 py-4 flex flex-col gap-3">
            {passwordError && <p role="alert" className="text-xs text-danger-600">{passwordError}</p>}
            {passwordSuccess ? (
              <button onClick={closePasswordReset}
                className="w-full py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-800 transition-colors">
                Done
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={closePasswordReset} disabled={passwordSaving}
                  className="flex-1 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40">
                  Cancel
                </button>
                <button onClick={handlePasswordReset}
                  disabled={newPassword.length < 8 || newPassword !== confirmPassword || passwordSaving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {passwordSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Change password
                </button>
              </div>
            )}
          </div>
        }
      >
        <div className="px-6 py-5 space-y-4">
          {passwordSuccess ? (
            <div role="status" className="rounded-xl border border-success-600/20 bg-success-50 px-4 py-4 text-sm text-success-600">
              Password changed successfully for <span className="font-semibold">{passwordTarget?.name}</span>.
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-500">
                Set a new sign-in password for <span className="font-semibold text-neutral-700">{passwordTarget?.name}</span>.
                The current password is not required for an administrator reset.
              </p>
              <div>
                <label htmlFor="new-staff-password" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input id="new-staff-password" type={showResetPassword ? 'text' : 'password'}
                    autoComplete="new-password" autoFocus value={newPassword}
                    onChange={(event) => { setNewPassword(event.target.value); setPasswordError('') }}
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                  <button type="button" onClick={() => setShowResetPassword((visible) => !visible)}
                    aria-label={showResetPassword ? 'Hide passwords' : 'Show passwords'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-staff-password" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                  Confirm New Password
                </label>
                <input id="confirm-staff-password" type={showResetPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={confirmPassword}
                  onChange={(event) => { setConfirmPassword(event.target.value); setPasswordError('') }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && newPassword.length >= 8 && newPassword === confirmPassword && !passwordSaving) {
                      void handlePasswordReset()
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-danger-600">Passwords do not match.</p>
                )}
              </div>
              <p className="text-xs text-neutral-400">Use at least eight characters. Django password rules are checked when you save.</p>
            </>
          )}
        </div>
      </StaffDialogModal>

      {/* ── Delete confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove staff member?"
        message={
          <><span className="font-semibold text-neutral-600">{deleteTarget?.name}</span> will be permanently removed from the system.</>
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  )
}
