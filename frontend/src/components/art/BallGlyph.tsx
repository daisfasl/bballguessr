import type { JSX } from 'react'
import '../../css/halftone-ball.css'

export interface BallGlyphProps {
  size?: number | string // default '1em'
  filled?: boolean // default true. filled = solid ink disc with seams knocked out in paper; hollow = outline circle + seams
  spinning?: boolean // default false; used for the loading state (~1s/turn)
  className?: string
}

// Classic ball icon on a 24-unit grid: a vertical seam, a horizontal seam and
// two side curves. Kept to straight lines and two quadratic arcs so it stays
// crisp down to 12px.
// Endpoints sit on (or just past) the r=11 rim so the seams meet the outline.
const SEAMS = 'M12 1V23M1 12H23M5.1 3.4Q10.6 12 5.1 20.6M18.9 3.4Q13.4 12 18.9 20.6'

export function BallGlyph({ size = '1em', filled = true, spinning = false, className }: BallGlyphProps): JSX.Element {
  const cls = ['BallGlyph', filled ? 'BallGlyph--filled' : 'BallGlyph--hollow', spinning && 'BallGlyph--spin', className]
    .filter(Boolean)
    .join(' ')

  return (
    <svg className={cls} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {filled ? (
        <>
          <circle cx="12" cy="12" r="11.25" fill="currentColor" />
          <path className="BallGlyph-knockout" d={SEAMS} fill="none" strokeWidth="2.1" />
        </>
      ) : (
        <>
          <path d={SEAMS} fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="10.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}
