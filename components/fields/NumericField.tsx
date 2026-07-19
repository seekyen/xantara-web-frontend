'use client'

import { useState } from 'react'

interface NumericFieldProps {
  label: string
  labelWidth?: string
  name?: string
  defaultValue?: string
}

// Text input restricted to numeric characters (no native number-spinner arrows),
// right-aligned with a "0.00" placeholder.
export default function NumericField({ label, labelWidth = 'w-28', name, defaultValue = '' }: NumericFieldProps) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <input type="text" inputMode="decimal" name={name} value={value} placeholder="0.00"
        onChange={(e) => {
          const v = e.target.value
          if (/^\d*\.?\d*$/.test(v)) setValue(v)
        }}
        className="flex-1 min-w-0 w-full px-3 py-2 text-sm text-right border border-neutral-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </div>
  )
}
