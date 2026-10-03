import { useState, type CSSProperties } from 'react'
import { DitheredImage } from '../../components/art/DitheredImage'
import { CourtLines } from '../../components/art/CourtLines'

// Dev-only review page for the print art (DitheredImage, CourtLines).
// Not routed yet; the main session wires it into the /__art route.

const HEADSHOT = (id: string) =>
  `https://www.basketball-reference.com/req/202106291/images/headshots/${id}.jpg`

const SAMPLES = [
  { id: 'jamesle01', name: 'LeBron James' },
  { id: 'duncati01', name: 'Tim Duncan' },
  { id: 'curryst01', name: 'Stephen Curry' },
]

const mono: CSSProperties = {
  fontFamily: 'ui-monospace, "IBM Plex Mono", monospace',
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.7,
}

function Tile({
  src,
  alt,
  size,
  note,
}: {
  src: string | null
  alt: string
  size: number
  note: string
}) {
  const [readyCount, setReadyCount] = useState(0)
  return (
    <figure style={{ margin: 0, display: 'grid', gap: 14, justifyItems: 'start' }}>
      <DitheredImage
        src={src}
        alt={alt}
        size={size}
        onReady={() => setReadyCount((n) => n + 1)}
      />
      <figcaption style={mono}>
        {note} / ready {readyCount}
      </figcaption>
    </figure>
  )
}

function Panel({ dark, run }: { dark: boolean; run: number }) {
  const panel: CSSProperties = dark
    ? { background: '#151514', color: '#E4E2DC' }
    : { background: '#E4E2DC', color: '#000' }
  const body = (
    <div style={{ padding: 32, display: 'grid', gap: 40 }}>
      <p style={mono}>{dark ? 'Dark panel' : 'Light panel'}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'end' }}>
        {SAMPLES.map((s) => (
          <Tile key={`${s.id}-240-${run}`} src={HEADSHOT(s.id)} alt={s.name} size={240} note={`${s.id} 240`} />
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'end' }}>
        {SAMPLES.map((s) => (
          <Tile key={`${s.id}-120-${run}`} src={HEADSHOT(s.id)} alt={s.name} size={120} note={`${s.id} 120`} />
        ))}
        <Tile
          key={`broken-${run}`}
          src={HEADSHOT('doesnotexist99')}
          alt="Broken headshot"
          size={120}
          note="broken url"
        />
        <Tile key={`null-${run}`} src={null} alt="No headshot" size={120} note="src null" />
      </div>

      {/* transform makes this box the containing block for the fixed backdrop, so it crops here. */}
      <div
        style={{
          position: 'relative',
          width: 600,
          maxWidth: '100%',
          height: 400,
          overflow: 'hidden',
          transform: 'translateZ(0)',
          outline: '1px dashed currentColor',
          outlineOffset: -1,
        }}
      >
        <CourtLines />
        <p style={{ ...mono, position: 'relative', zIndex: 1, margin: 16 }}>
          CourtLines backdrop, 600 × 400
        </p>
      </div>
    </div>
  )
  return dark ? (
    <div data-theme="dark" style={panel}>
      {body}
    </div>
  ) : (
    <div style={panel}>{body}</div>
  )
}

export function PrintLab() {
  const [run, setRun] = useState(0)
  return (
    <div>
      <div style={{ padding: '16px 32px' }}>
        <button type="button" onClick={() => setRun((r) => r + 1)}>
          Replay develop
        </button>
      </div>
      <Panel dark={false} run={run} />
      <Panel dark run={run} />
    </div>
  )
}
