'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

// EAN13/UPC only accept a fixed-length numeric payload — derive one from the
// source value's digits (zero-padded/truncated) so those formats still render a
// barcode. Truncate from the END (keep the leading digits) so the rendered code
// still resembles what was typed — jsbarcode always computes its own trailing
// check digit anyway, so the very last digit never matches verbatim regardless.
function toBarcodeValue(value: string, format: string) {
  if (format === 'EAN13') return value.replace(/\D/g, '').slice(0, 12).padStart(12, '0')
  if (format === 'UPC') return value.replace(/\D/g, '').slice(0, 11).padStart(11, '0')
  return value
}

// Renders a live barcode preview via jsbarcode (SVG-based, not a React component itself).
export default function BarcodePreview({ value, format, height = 50, displayValue = true }: {
  value: string; format: string; height?: number; displayValue?: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    if (!value) { svgRef.current.innerHTML = ''; return }
    try {
      JsBarcode(svgRef.current, toBarcodeValue(value, format), {
        format, width: 1.5, height, fontSize: 12, margin: 8, displayValue,
      })
    } catch {
      svgRef.current.innerHTML = ''
    }
  }, [value, format, height, displayValue])

  return <svg ref={svgRef} />
}
