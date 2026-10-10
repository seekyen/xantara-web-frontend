type Props = { unit: string; className?: string }

// Small, local vectors stay crisp at any size and work without image downloads.
const shapes: Record<string, string> = {
  bottle: 'M19 3h10v5H19z M20 10h8v7l6 8v17a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V25l6-8z',
  can: 'M14 8a10 4 0 1 0 20 0 10 4 0 1 0-20 0 M14 13q10 6 20 0v26q-10 8-20 0z',
  sachet: 'M13 5l4 2 4-2 4 2 4-2 5 2 1 34-4 2-4-2-4 2-4-2-5 2z',
  pc: 'M24 5a19 19 0 1 0 0 38 19 19 0 1 0 0-38z M18 18l6-5h4v19h5v4H17v-4h6V19l-3 3z',
  box: 'M24 13l-13-7L1 15l13 7z M24 13l13-7 10 9-13 7z M6 23l16 7v15L6 37z M26 30l16-7v14l-16 8z M17 24l7-5 7 5-7 3z',
  carton: 'M15 4h18l7 10v29H8V14z M17 8l-4 7h14l4-7z M12 21v3h24v-3z',
  case: 'M6 10h36v31H6z M10 14v5h28v-5z M10 24v3h5v-3z M21 24v3h6v-3z M33 24v3h5v-3z M10 32v3h28v-3z',
  tray: 'M4 24h40l-5 16H9z M7 16h8v5H7z M20 16h8v5h-8z M33 16h8v5h-8z',
  sack: 'M15 4h18l-5 9h-8z M19 16h10c2 8 12 12 12 22 0 7-34 7-34 0 0-10 10-14 12-22z',
  bag: 'M10 14h28l4 29H6z M17 14V9a7 7 0 0 1 14 0v5h-4V9a3 3 0 0 0-6 0v5z',
  pack: 'M9 9h30v31H9z M20 9v13l4-3 4 3V9z',
  bundle: 'M5 10h38v12H5z M5 26h38v12H5z M21 6h6v36h-6z',
  dozen: 'M5 10h7v7H5z M15 10h7v7h-7z M26 10h7v7h-7z M36 10h7v7h-7z M5 21h7v7H5z M15 21h7v7h-7z M26 21h7v7h-7z M36 21h7v7h-7z M5 32h7v7H5z M15 32h7v7h-7z M26 32h7v7h-7z M36 32h7v7h-7z',
  drum: 'M9 8q15-8 30 0v32q-15 8-30 0z M12 16v3h24v-3z M12 29v3h24v-3z',
  roll: 'M16 5a11 19 0 1 0 0 38h21V5z M16 10a6 14 0 1 1 0 28 6 14 0 1 1 0-28z',
  weight: 'M18 12a6 6 0 1 1 12 0h6l8 31H4l8-31z M21 12h6a3 3 0 1 0-6 0z',
  liquid: 'M24 3C20 12 9 23 9 31a15 15 0 0 0 30 0C39 23 28 12 24 3z',
  meter: 'M4 15h40v18H4z M10 15v10h3V15z M18 15v6h3v-6z M26 15v10h3V15z M34 15v6h3v-6z',
  custom: 'M24 4a20 20 0 1 0 0 40 20 20 0 1 0 0-40z M22 13h4v9h9v4h-9v9h-4v-9h-9v-4h9z',
}

export default function UomSilhouette({ unit, className = 'h-10 w-10' }: Props) {
  const normalized = unit.trim().toLowerCase()
  const key = ['kg', 'g'].includes(normalized) ? 'weight'
    : ['l', 'ml'].includes(normalized) ? 'liquid'
    : ['m', 'meter'].includes(normalized) ? 'meter'
    : ['piece', 'pcs'].includes(normalized) ? 'pc' : normalized
  return <svg viewBox="0 0 48 48" className={className} fill="currentColor" aria-hidden="true" focusable="false"><path fillRule="evenodd" d={shapes[key] || shapes.custom}/></svg>
}
