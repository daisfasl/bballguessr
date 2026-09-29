import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HEADSHOT_THRESHOLD,
  HEADSHOT_TONE,
  atkinsonDither,
  backdropMask,
  sharpenRadiusFor,
  squareCoverCrop,
  toGrayscale,
  workingResolution,
} from '../../lib/dither'
import '../../css/print-art.css'

export interface DitheredImageProps {
  src: string | null
  alt: string
  size?: number // CSS px of the square frame, default 240
  framed?: boolean // default true: four corner tick marks (crosshair corners) around the square
  onReady?: () => void // called once the dither (or fallback) has painted, so the parent can sequence the reveal
  className?: string
}

type Status = 'loading' | 'painted' | 'fallback' | 'empty'

interface Dither {
  bits: Uint8Array // 1 = ink
  backdrop: Uint8Array // 1 = studio backdrop
  w: number
}

/** Resolves any CSS color string (incl. currentColor results) to RGB bytes. */
function resolveRgb(color: string): [number, number, number] {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const ctx = c.getContext('2d')
  if (!ctx) return [0, 0, 0]
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function paint(canvas: HTMLCanvasElement, d: Dither, size: number) {
  const [r, g, b] = resolveRgb(getComputedStyle(canvas).color)
  // Light ink (dark theme) prints the subject positive: ink goes where the
  // dither left paper, and the backdrop stays transparent. Dark ink prints
  // the dither as is. Either way the face reads the right way round.
  const lightInk = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5

  const { bits, backdrop, w } = d
  const work = document.createElement('canvas')
  work.width = work.height = w
  const wctx = work.getContext('2d')
  if (!wctx) return
  const img = wctx.createImageData(w, w)
  for (let i = 0; i < bits.length; i++) {
    const on = lightInk ? !bits[i] && !backdrop[i] : bits[i] === 1
    if (!on) continue
    const o = i * 4
    img.data[o] = r
    img.data[o + 1] = g
    img.data[o + 2] = b
    img.data[o + 3] = 255
  }
  wctx.putImageData(img, 0, 0)

  // Back the display canvas at device pixels and scale up nearest-neighbour,
  // so cells stay crisp on hi-dpi screens.
  const device = Math.max(1, Math.round(size * (window.devicePixelRatio || 1)))
  canvas.width = canvas.height = device
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, device, device)
  ctx.drawImage(work, 0, 0, device, device)
}

function ditherImage(img: HTMLImageElement, size: number): Dither {
  const { sx, sy, side } = squareCoverCrop(img.naturalWidth, img.naturalHeight)
  const w = workingResolution(size, side)
  const c = document.createElement('canvas')
  c.width = c.height = w
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2d context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, w, w)
  const { data } = ctx.getImageData(0, 0, w, w) // throws SecurityError if tainted
  const gray = toGrayscale(data, w, w, { ...HEADSHOT_TONE, sharpenRadius: sharpenRadiusFor(w) })
  return {
    bits: atkinsonDither(gray, w, w, HEADSHOT_THRESHOLD),
    backdrop: backdropMask(data, w, w),
    w,
  }
}

export function DitheredImage({
  src,
  alt,
  size = 240,
  framed = true,
  onReady,
  className,
}: DitheredImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ditherRef = useRef<Dither | null>(null)
  const onReadyRef = useRef(onReady)
  const readyFor = useRef<string | null | undefined>(undefined)
  // Status is tagged with the src/size it belongs to, so a new src reads as
  // 'loading' straight away without a reset render.
  const [result, setResult] = useState<{ key: string; status: Status } | null>(null)

  const key = `${src ?? ''}@${size}`
  const status: Status =
    src === null ? 'empty' : result && result.key === key ? result.status : 'loading'

  useEffect(() => {
    onReadyRef.current = onReady
  })

  const ready = useCallback(() => {
    if (readyFor.current === src) return
    readyFor.current = src
    onReadyRef.current?.()
  }, [src])

  // Load, crop, dither, paint.
  useEffect(() => {
    if (src === null) return
    let cancelled = false
    ditherRef.current = null
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      const canvas = canvasRef.current
      try {
        const d = ditherImage(img, size)
        ditherRef.current = d
        if (canvas) paint(canvas, d, size)
        setResult({ key, status: 'painted' })
      } catch {
        // SecurityError (tainted canvas) or no 2d context: show the photo plainly.
        setResult({ key, status: 'fallback' })
      }
    }
    img.onerror = () => {
      if (!cancelled) setResult({ key, status: 'fallback' })
    }
    img.src = src
    return () => {
      cancelled = true
      img.onload = img.onerror = null
    }
  }, [src, size, key])

  // Re-colour from the cached bits when the theme flips. No reload.
  useEffect(() => {
    if (status !== 'painted') return
    const repaint = () => {
      const canvas = canvasRef.current
      const d = ditherRef.current
      if (canvas && d) paint(canvas, d, size)
    }
    const observer = new MutationObserver(repaint)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    })
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', repaint)
    return () => {
      observer.disconnect()
      mq.removeEventListener('change', repaint)
    }
  }, [status, size])

  // onReady for the paths that paint synchronously.
  useEffect(() => {
    if (status === 'painted' || status === 'empty') ready()
  }, [status, ready])

  const classes = ['DitheredImage', framed ? 'DitheredImage--framed' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role="img"
      aria-label={alt}
      data-status={status}
      style={{ width: size, height: size }}
    >
      {(status === 'loading' || status === 'painted') && (
        <canvas
          ref={canvasRef}
          className="DitheredImage-media DitheredImage-canvas"
          aria-hidden="true"
        />
      )}
      {status === 'fallback' && src !== null && (
        <img
          className="DitheredImage-media DitheredImage-photo"
          src={src}
          alt=""
          aria-hidden="true"
          onLoad={ready}
          onError={() => {
            setResult({ key, status: 'empty' })
          }}
        />
      )}
      {status === 'empty' && <span className="DitheredImage-empty" aria-hidden="true" />}
      {framed && (
        <span className="DitheredImage-ticks" aria-hidden="true">
          <span className="DitheredImage-tick DitheredImage-tick--tl" />
          <span className="DitheredImage-tick DitheredImage-tick--tr" />
          <span className="DitheredImage-tick DitheredImage-tick--bl" />
          <span className="DitheredImage-tick DitheredImage-tick--br" />
        </span>
      )}
    </div>
  )
}
