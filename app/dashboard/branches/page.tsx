'use client'

import { useState } from 'react'
import { GitBranch, Plus, X, Check } from 'lucide-react'
import ConfirmModal from '@/components/shared/ConfirmModal'

interface Branch {
  id:       string
  name:     string
  address:  string
  cashiers: number
  active:   boolean
}

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

const INITIAL: Branch[] = [
  { id: 'b1', name: 'Makati',  address: '123 Ayala Ave',    cashiers: 3, active: true  },
  { id: 'b2', name: 'BGC',     address: '456 BGC High St',  cashiers: 2, active: true  },
  { id: 'b3', name: 'Quezon',  address: '789 Quezon Blvd',  cashiers: 2, active: false },
]

const EMPTY: Omit<Branch, 'id'> = { name: '', address: '', cashiers: 1, active: true }

export default function BranchesPage() {
  const [branches,     setBranches]     = useState<Branch[]>(INITIAL)
  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState<string | null>(null)
  const [form,         setForm]         = useState<Omit<Branch, 'id'>>(EMPTY)
  const [savedMsg,     setSavedMsg]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)

  const openAdd = () => {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (b: Branch) => {
    setEditId(b.id)
    setForm({ name: b.name, address: b.address, cashiers: b.cashiers, active: b.active })
    setShowForm(true)
  }

  const closeForm = () => setShowForm(false)

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editId) {
      setBranches((prev) => prev.map((b) => b.id === editId ? { ...b, ...form } : b))
    } else {
      setBranches((prev) => [...prev, { id: `b${Date.now()}`, ...form }])
    }
    closeForm()
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="pb-8">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Branches</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage store branches</p>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success-600">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold
              bg-brand-600 text-white rounded-lg hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {/* ── Branch list ── */}
      <div className="px-6">
        {branches.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <GitBranch className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">No branches yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {branches.map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center gap-4 px-5 py-4
                  ${i < branches.length - 1 ? 'border-b border-neutral-100' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-800">{b.name}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {b.address} &middot; {b.cashiers} cashier{b.cashiers !== 1 ? 's' : ''}
                  </div>
                </div>
                <Toggle
                  checked={b.active}
                  onChange={(v) => setBranches((prev) => prev.map((x) => x.id === b.id ? { ...x, active: v } : x))}
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-600 rounded-md
                      hover:bg-neutral-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="px-3 py-1.5 text-xs font-semibold text-danger-600 rounded-md
                      hover:bg-danger-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Backdrop ── */}
      <div
        onClick={closeForm}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300
          ${showForm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── Slide-in drawer ── */}
      <aside
        className={`fixed top-0 right-0 h-full w-[400px] z-50 bg-white shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${showForm ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-800">
            {editId ? 'Edit Branch' : 'New Branch'}
          </h2>
          <button
            onClick={closeForm}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Branch Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Makati"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Address
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="123 Ayala Ave"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Number of Cashiers
            </label>
            <input
              type="number"
              min={0}
              value={form.cashiers}
              onChange={(e) => setForm((f) => ({ ...f, cashiers: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-sm font-medium text-neutral-800">Active</div>
              <div className="text-xs text-neutral-400">Branch is open and operational</div>
            </div>
            <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>
        </div>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg
              hover:bg-brand-800 transition-colors"
          >
            {editId ? 'Update Branch' : 'Add Branch'}
          </button>
          <button
            onClick={closeForm}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100
              rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete branch?"
        message={`Remove "${deleteTarget?.name}" branch? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
