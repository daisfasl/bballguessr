import { useMemo, type JSX } from 'react'
import '../../css/halftone-ball.css'

export interface HalftoneBallProps {
  size?: number // rendered px width/height, default 320
  spin?: boolean // default true; slow seam rotation
  label?: string // if given: role="img" + aria-label; otherwise aria-hidden
  className?: string
}

// Everything is drawn in a fixed 320-unit box and scaled by the svg width,
// so seam and dot weights scale with `size` for free.
const VB = 320
const C = VB / 2
const R = 154 // ball radius, leaves room for the outline stroke

type Vec3 = [number, number, number]

const r2 = (n: number) => Math.round(n * 100) / 100

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const m = Math.hypot(x, y, z)
  return [x / m, y / m, z / m]
}

// Screen space: +x right, +y down, +z toward the viewer.
const LIGHT = normalize([-0.5, -0.6, 0.62])
const BOUNCE = normalize([0.55, 0.75, -0.35])

// Deterministic hash -> [0, 1). Used for the pebble jitter so the texture is
// stable across renders and between server and client.
function hash(i: number, j: number, seed: number): number {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

// Smooth value noise for low-frequency mottling (scuffed leather patches).
function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, 7)
  const b = hash(xi + 1, yi, 7)
  const c = hash(xi, yi + 1, 7)
  const d = hash(xi + 1, yi + 1, 7)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Ink coverage (0 = bare paper, 1 = solid ink) for a point on the visible hemisphere. */
function inkAt(nx: number, ny: number, nz: number): number {
  const ndl = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]
  const lambert = Math.max(0, ndl)
  // Wrapped diffuse so the shadow side rolls off gradually instead of
  // going flat black at the terminator.
  const wrap = Math.max(0, (ndl + 0.42) / 1.42)
  const bounce = Math.max(0, nx * BOUNCE[0] + ny * BOUNCE[1] + nz * BOUNCE[2])

  let light = 0.14 + 0.7 * Math.pow(wrap, 1.25)
  light += 0.24 * Math.pow(lambert, 8) // hot spot burns out to paper
  light += 0.2 * Math.pow(bounce, 2) * (1 - wrap) // reflected light, lower-right rim
  light -= 0.22 * Math.pow(1 - nz, 2.6) // rim darkening

  // Core shadow: a soft band just past the terminator, before the bounce.
  light -= 0.1 * Math.exp(-Math.pow(ndl / 0.2, 2))

  return 1 - light
}

interface Dot {
  x: number
  y: number
  r: number
}

// Engraving direction: dots sit on rings around this axis, laid out evenly on
// the sphere's surface, so the rows curve with the form and bunch up toward
// the silhouette the way an etcher's contour lines do.
const AXIS = normalize([0.3, -1, 0.16])
const AXIS_U = normalize([AXIS[1], -AXIS[0], 0]) // AXIS x view direction
const AXIS_V: Vec3 = [
  AXIS[1] * AXIS_U[2] - AXIS[2] * AXIS_U[1],
  AXIS[2] * AXIS_U[0] - AXIS[0] * AXIS_U[2],
  AXIS[0] * AXIS_U[1] - AXIS[1] * AXIS_U[0],
]

/**
 * Two dot plates from the same lighting: `shade` puts ink where the ball is
 * dark (ink on paper, light theme), `chalk` puts it where the ball is lit
 * (light ink on blacktop, dark theme). Only one is shown at a time, so the
 * ball never renders as a photographic negative.
 */
function buildDots(size: number): { shade: Dot[]; chalk: Dot[] } {
  // Surface spacing ~7.8 units at 320px (about 2k visible dots). Never let
  // dots get closer than ~4 rendered px or small balls turn to grey mush.
  const s = Math.max(7.8, (4 * VB) / size)
  const rMax = s * 0.62
  const shade: Dot[] = []
  const chalk: Dot[] = []
  const rings = Math.round((Math.PI * R) / s)

  const push = (list: Dot[], dx: number, dy: number, nz: number, ink: number) => {
    ink = Math.min(0.97, Math.max(0, ink))
    // Area-proportional radius. The projected cell shrinks by nz toward the
    // limb, so dots shrink with it and the tone holds.
    let r = rMax * Math.sqrt(ink * (0.25 + 0.75 * nz))
    if (r < 0.35) return
    r = Math.min(r, R + 0.6 - Math.hypot(dx, dy))
    list.push({ x: r2(C + dx), y: r2(C + dy), r: r2(r) })
  }

  for (let j = 1; j < rings; j++) {
    const theta = (j / rings) * Math.PI
    const st = Math.sin(theta)
    const ct = Math.cos(theta)
    const n = Math.max(1, Math.round((2 * Math.PI * R * st) / s))
    const phase = (j % 2) * 0.5 + hash(j, 0, 4) * 0.3
    for (let i = 0; i < n; i++) {
      const phi = ((i + phase + (hash(i, j, 1) - 0.5) * 0.24) / n) * Math.PI * 2
      const cp = Math.cos(phi) * st
      const sp = Math.sin(phi) * st
      const nx = AXIS[0] * ct + AXIS_U[0] * cp + AXIS_V[0] * sp
      const ny = AXIS[1] * ct + AXIS_U[1] * cp + AXIS_V[1] * sp
      const nz = AXIS[2] * ct + AXIS_U[2] * cp + AXIS_V[2] * sp
      if (nz < 0.04) continue

      const dx = nx * R
      const dy = ny * R
      const base = inkAt(nx, ny, nz)
      // Pebble grain + leather mottling so it reads as etched, not plotted.
      const mottle = (valueNoise(dx / 30 + 11, dy / 30 + 3) - 0.5) * 0.18
      const grain = 0.86 + 0.28 * hash(i, j, 3)
      push(shade, dx, dy, nz, (base + mottle) * grain)
      push(chalk, dx, dy, nz, (0.92 - base - mottle) * grain)
    }
  }
  return { shade, chalk }
}

// --- Seams -----------------------------------------------------------------

// Ball-local frame: the two great circles are y=0 ("horizontal") and x=0
// ("vertical"); the two side curves are the small circles x = ±SIDE.
const SIDE = 0.7

function rotation(yaw: number, pitch: number, roll: number) {
  const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)]
  const [cp, sp] = [Math.cos(pitch), Math.sin(pitch)]
  const [cr, sr] = [Math.cos(roll), Math.sin(roll)]
  return ([x, y, z]: Vec3): Vec3 => {
    // yaw about y, then pitch about x, then roll about z (y up, z toward viewer)
    const x1 = cy * x + sy * z
    const z1 = -sy * x + cy * z
    const y2 = cp * y - sp * z1
    const z2 = sp * y + cp * z1
    return [cr * x1 - sr * y2, sr * x1 + cr * y2, z2]
  }
}

// A slight three-quarter view, like the engraved reference.
const rotate = rotation(-0.5, 0.32, -0.22)

const SEAM_CURVES: ((t: number) => Vec3)[] = [
  (t) => [Math.cos(t), 0, Math.sin(t)],
  (t) => [0, Math.cos(t), Math.sin(t)],
  (t) => [SIDE, Math.sqrt(1 - SIDE * SIDE) * Math.cos(t), Math.sqrt(1 - SIDE * SIDE) * Math.sin(t)],
  (t) => [-SIDE, Math.sqrt(1 - SIDE * SIDE) * Math.cos(t), Math.sqrt(1 - SIDE * SIDE) * Math.sin(t)],
]

interface P {
  x: number
  y: number
  z: number
}

/** Visible runs of a seam curve, projected orthographically to the screen. */
function visibleRuns(curve: (t: number) => Vec3): P[][] {
  const N = 240
  const pts: P[] = []
  for (let k = 0; k < N; k++) {
    const [x, y, z] = rotate(curve((k / N) * Math.PI * 2))
    pts.push({ x: C + x * R, y: C - y * R, z })
  }
  // Start the walk at a hidden point so runs don't wrap around the seam.
  const start = pts.findIndex((p) => p.z <= 0)
  const ordered = start < 0 ? pts : [...pts.slice(start), ...pts.slice(0, start)]
  const runs: P[][] = []
  let cur: P[] = []
  for (let k = 0; k < ordered.length; k++) {
    const p = ordered[k]
    if (p.z > 0) {
      if (cur.length === 0 && k > 0) cur.push(limbPoint(ordered[k - 1], p))
      cur.push(p)
    } else if (cur.length) {
      cur.push(limbPoint(cur[cur.length - 1], p))
      runs.push(cur)
      cur = []
    }
  }
  if (cur.length) runs.push(cur)
  return runs
}

// Interpolate to the silhouette (z = 0) so seams meet the outline cleanly.
function limbPoint(a: P, b: P): P {
  const t = a.z / (a.z - b.z)
  const x = a.x + (b.x - a.x) * t - C
  const y = a.y + (b.y - a.y) * t - C
  const m = Math.hypot(x, y) / R
  return { x: C + x / m, y: C + y / m, z: 0 }
}

/**
 * A seam as a filled ribbon whose width follows foreshortening: full weight
 * where it faces the viewer, tapering toward the limb. `extra` widens it for
 * the paper-colored gap that sits underneath.
 */
function ribbon(run: P[], width: number, extra: number): string {
  const left: string[] = []
  const right: string[] = []
  for (let k = 0; k < run.length; k++) {
    const a = run[Math.max(0, k - 1)]
    const b = run[Math.min(run.length - 1, k + 1)]
    const tx = b.x - a.x
    const ty = b.y - a.y
    const m = Math.hypot(tx, ty) || 1
    const hw = (width * (0.38 + 0.62 * Math.sqrt(run[k].z)) + extra) / 2
    const ox = (-ty / m) * hw
    const oy = (tx / m) * hw
    left.push(`${r2(run[k].x + ox)} ${r2(run[k].y + oy)}`)
    right.push(`${r2(run[k].x - ox)} ${r2(run[k].y - oy)}`)
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`
}

// Seam weight in viewBox units: 3.2 is ~2.5px at full weight at 320px.
// Below ~260px the strokes are thickened so they don't fall under ~1.8px.
const seamScale = (size: number) => Math.max(1, (0.72 * VB) / size)

const RUNS = SEAM_CURVES.flatMap(visibleRuns)

function buildSeams(size: number) {
  const k = seamScale(size)
  return {
    // One path per run: overlapping ribbons in a single path could cancel
    // each other out under the nonzero fill rule where they cross.
    gap: RUNS.map((run) => ribbon(run, 3.2 * k, 2 * k)),
    ink: RUNS.map((run) => ribbon(run, 3.2 * k, 0)),
  }
}

export function HalftoneBall({ size = 320, spin = true, label, className }: HalftoneBallProps): JSX.Element {
  const dots = useMemo(() => buildDots(size), [size])
  const seams = useMemo(() => buildSeams(size), [size])
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }

  return (
    <svg
      className={['HalftoneBall', spin && 'HalftoneBall--spin', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      focusable="false"
      {...a11y}
    >
      <g className="HalftoneBall-dots HalftoneBall-dots--shade" fill="currentColor">
        {dots.shade.map((d, k) => (
          <circle key={k} cx={d.x} cy={d.y} r={d.r} />
        ))}
      </g>
      <g className="HalftoneBall-dots HalftoneBall-dots--chalk" fill="currentColor">
        {dots.chalk.map((d, k) => (
          <circle key={k} cx={d.x} cy={d.y} r={d.r} />
        ))}
      </g>
      <g className="HalftoneBall-seams">
        {seams.gap.map((d, k) => (
          <path key={`g${k}`} className="HalftoneBall-gap" d={d} />
        ))}
        {seams.ink.map((d, k) => (
          <path key={`s${k}`} className="HalftoneBall-seam" d={d} />
        ))}
      </g>
      <circle className="HalftoneBall-outline" cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeWidth={2.2 * seamScale(size)} />
    </svg>
  )
}
