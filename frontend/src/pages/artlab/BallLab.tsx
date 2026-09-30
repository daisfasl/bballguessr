import type { CSSProperties, ReactNode } from 'react'
import { HalftoneBall } from '../../components/art/HalftoneBall'
import { BallGlyph } from '../../components/art/BallGlyph'

// Dev-only demo of every HalftoneBall / BallGlyph variant on both papers.
// Wired into the /__art route by the main session; deleted in Phase 3.

const panel: CSSProperties = { padding: 24, display: 'grid', gap: 24 }
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 24 }
const cap: CSSProperties = { fontFamily: 'monospace', fontSize: 11, opacity: 0.7, marginTop: 6 }

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure style={{ margin: 0 }}>
      {children}
      <figcaption style={cap}>{caption}</figcaption>
    </figure>
  )
}

function Variants() {
  return (
    <>
      <div style={row}>
        {[320, 220, 120].map((size) => (
          <Cell key={`spin${size}`} caption={`${size} spin`}>
            <HalftoneBall size={size} label={`Basketball, ${size}px`} />
          </Cell>
        ))}
      </div>
      <div style={row}>
        {[320, 220, 120].map((size) => (
          <Cell key={`static${size}`} caption={`${size} static`}>
            <HalftoneBall size={size} spin={false} />
          </Cell>
        ))}
      </div>
      <div style={row}>
        {[true, false].flatMap((filled) =>
          [12, 16, 24].map((size) => (
            <Cell key={`${filled}${size}`} caption={`${size} ${filled ? 'filled' : 'hollow'}`}>
              <BallGlyph size={size} filled={filled} />
            </Cell>
          )),
        )}
        <Cell caption="16 spinning">
          <BallGlyph size={16} spinning />
        </Cell>
        <Cell caption="1em inline">
          <span style={{ fontSize: 14, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <BallGlyph />
            <BallGlyph />
            <BallGlyph filled={false} />
            <span style={{ marginLeft: 6 }}>
              <BallGlyph spinning /> Loading round…
            </span>
          </span>
        </Cell>
      </div>
    </>
  )
}

export function BallLab() {
  return (
    <div>
      {/* --paper is set per panel too, in case the global tokens only define it on :root. */}
      <div data-theme="light" style={{ ...panel, background: '#E4E2DC', color: '#000', '--paper': '#E4E2DC' } as CSSProperties}>
        <Variants />
      </div>
      <div data-theme="dark" style={{ ...panel, background: '#151514', color: '#E4E2DC', '--paper': '#151514' } as CSSProperties}>
        <Variants />
      </div>
    </div>
  )
}
