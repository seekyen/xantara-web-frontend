'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface DrawerModalProps {
  isOpen:   boolean
  onClose:  () => void
  title:    string
  children: ReactNode
  footer?:  ReactNode
  width?:   string
}

export default function DrawerModal({
  isOpen, onClose, title, children, footer, width = 'w-[480px]',
}: DrawerModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 h-full ${width} z-50 bg-white
        shadow-2xl flex flex-col animate-slide-in-right`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <h2 className="text-base font-bold text-neutral-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center
              justify-center transition-colors"
          >
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="border-t border-neutral-100 flex-shrink-0">{footer}</div>
        )}
      </div>
    </>
  )
}
