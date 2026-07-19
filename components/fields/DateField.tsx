'use client'

import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, isValid } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import 'react-day-picker/style.css'

interface DateFieldProps {
  label: string
  labelWidth?: string
  name?: string
  /** Initial date as an ISO string (e.g. "2026-01-15") — used to pre-fill when editing. */
  defaultValue?: string | null
}

// Custom calendar popover (react-day-picker) — label-left layout, matches the other inline fields.
const CALENDAR_HEIGHT = 320 // approx rendered height, used for flip-detection

export default function DateField({ label, labelWidth = 'w-32', name, defaultValue }: DateFieldProps) {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined
    const parsed = parseISO(defaultValue)
    return isValid(parsed) ? parsed : undefined
  })
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleToggle = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setPlacement(spaceBelow < CALENDAR_HEIGHT && rect.top > CALENDAR_HEIGHT ? 'top' : 'bottom')
    }
    setOpen((o) => !o)
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className={`${labelWidth} flex-shrink-0 text-sm text-neutral-600`}>{label}</label>
      <div ref={wrapperRef} className="relative flex-1 min-w-0">
        {name && <input type="hidden" name={name} value={date ? format(date, 'yyyy-MM-dd') : ''} />}
        <button type="button" onClick={handleToggle}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-200
            rounded-md bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 text-left">
          <span className={date ? 'text-neutral-800' : 'text-neutral-400'}>
            {date ? format(date, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
          </span>
          <CalendarDays className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        </button>

        {open && (
          <div className={`absolute z-50 bg-white border border-neutral-200 rounded-lg shadow-lg p-2
            ${placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); setOpen(false) }}
              autoFocus
              classNames={{
                months: 'flex flex-col',
                month_caption: 'flex items-center justify-center h-8 text-sm font-semibold text-neutral-800',
                nav: 'flex items-center justify-between absolute inset-x-1 top-0 h-8',
                button_previous: 'w-7 h-7 flex items-center justify-center rounded-md hover:bg-neutral-100 text-neutral-500',
                button_next: 'w-7 h-7 flex items-center justify-center rounded-md hover:bg-neutral-100 text-neutral-500',
                month_grid: 'mt-1',
                weekday: 'text-[11px] font-semibold text-neutral-400 w-8 h-8',
                day: 'w-8 h-8 text-center',
                day_button: 'w-8 h-8 rounded-md text-sm text-neutral-700 hover:bg-neutral-100 transition-colors',
                today: 'font-bold text-brand-600',
                selected: '[&>button]:bg-brand-600 [&>button]:text-white [&>button]:hover:bg-brand-800',
                outside: 'text-neutral-300',
                disabled: 'text-neutral-300',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
