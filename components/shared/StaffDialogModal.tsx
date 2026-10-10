'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function StaffDialogModal({ isOpen, onClose, title, children, footer }: {
  isOpen: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !isOpen) return
    dialog.showModal()
    return () => dialog.close()
  }, [isOpen])

  return <dialog ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90dvh] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm">
    {isOpen && <div className="flex max-h-[90dvh] flex-col" onClick={event => event.stopPropagation()}>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-4">
        <h2 id={titleId} className="text-base font-bold text-neutral-800">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-600">
          <X className="h-4 w-4 text-neutral-600" />
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto">{children}</div>
      {footer && <div className="flex-shrink-0 border-t border-neutral-100">{footer}</div>}
    </div>}
  </dialog>
}
