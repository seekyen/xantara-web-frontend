'use client'

import { useEffect, useRef } from 'react'
import QRCodeStyling, { type Options } from 'qr-code-styling'
import { QR_LOGO_URL, type QRStyleOptions } from '@/lib/qrStyle'

// qr-code-styling is imperative (not a React component) — same pattern as
// BarcodePreview: build/update a single instance in a ref, append it once to
// a container div, then call .update() whenever value/style changes.
export default function QRCodePreview({ value, size = 96, style }: {
  value: string; size?: number; style: QRStyleOptions
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!containerRef.current || !value) return

    const options: Partial<Options> = {
      width:  size,
      height: size,
      data:   value,
      image:  style.includeLogo ? QR_LOGO_URL : undefined,
      dotsOptions:       { type: style.dotType, color: style.dotsColor },
      backgroundOptions: { color: style.backgroundColor },
      qrOptions:         { errorCorrectionLevel: style.errorCorrectionLevel },
      imageOptions:      { hideBackgroundDots: true, imageSize: 0.4, margin: 4 },
    }

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(options)
      containerRef.current.innerHTML = ''
      qrRef.current.append(containerRef.current)
    } else {
      qrRef.current.update(options)
    }
  }, [value, size, style.dotType, style.dotsColor, style.backgroundColor, style.errorCorrectionLevel, style.includeLogo])

  return <div ref={containerRef} />
}
