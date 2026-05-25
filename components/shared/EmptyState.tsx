import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon:         ReactNode
  title:        string
  description?: string
  action?:      { label: string; onClick: () => void }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-neutral-800 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-neutral-400 text-center max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-xs font-semibold text-brand-600 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
