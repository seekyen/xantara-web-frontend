'use client'

import { Trash2, AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

interface ConfirmModalProps {
  isOpen:        boolean
  onClose:       () => void
  onConfirm:     () => void
  title:         string
  message:       ReactNode
  confirmLabel?: string
  variant?:      'danger' | 'warning'
}

export default function ConfirmModal({
  isOpen, onClose, onConfirm,
  title, message, confirmLabel = 'Confirm', variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const Icon     = variant === 'danger' ? Trash2 : AlertTriangle
  const iconCls  = variant === 'danger' ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'
  const btnCls   = variant === 'danger' ? 'bg-danger-600 hover:bg-danger-600/90' : 'bg-warning-600 hover:bg-warning-600/90'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconCls}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800 mb-1">{title}</h3>
          <p className="text-sm text-neutral-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-neutral-600
                bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 text-sm font-semibold text-white
                rounded-lg transition-colors ${btnCls}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
