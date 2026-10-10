'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

// Small "shortcut" modal for adding a lookup-table entry (Category, Unit, etc.) without
// leaving the dialog you're filling out. If `onSubmit` is given, Save actually persists
// via the real API (and only closes on success — errors show a SweetAlert2 and keep the
// modal open). Without it, this stays a UI-only placeholder for lookups that don't have
// a backing API yet.
export default function AddEntityModal({ label, open, onClose, onSubmit }: {
  label: string; open: boolean; onClose: () => void; onSubmit?: (name: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  // Reset on the way out (not via an open-triggered effect) so the field is blank
  // next time, regardless of whether it closed via Cancel or a successful Save.
  const close = () => { setName(''); onClose() }

  const handleSave = async () => {
    if (!name.trim()) return
    if (!onSubmit) { close(); return }
    setSaving(true)
    try {
      await onSubmit(name.trim())
      close()
      Swal.fire({
        icon:              'success',
        title:             `${label} added!`,
        showConfirmButton: false,
        timer:             1600,
        timerProgressBar:  true,
      })
    } catch (err) {
      const title = err instanceof Error ? err.message : `Failed to add ${label.toLowerCase()}`
      Swal.fire({ icon: 'error', title })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-xl shadow-2xl w-80 p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-800">Add {label}</h3>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">{label} Name</label>
            <input type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()} name…`}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md
                focus:outline-none focus:ring-2 focus:ring-brand-600" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={close} disabled={saving}
              className="flex-1 py-2 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 py-2 text-sm font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
