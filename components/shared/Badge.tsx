import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger:  'bg-danger-50  text-danger-600',
  info:    'bg-brand-50   text-brand-600',
  neutral: 'bg-neutral-100 text-neutral-600',
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold
      rounded-full whitespace-nowrap ${CLASSES[variant]} ${className}`}>
      {children}
    </span>
  )
}
