// Pure 1-bit print helpers for DitheredImage. No DOM access, so they run in node too.

export interface GrayscaleOptions {
  /** Multiplier around mid-grey after the levels stretch. 1 = unchanged. */
  contrast?: number
  /** Output = input^gamma. Below 1 lightens the midtones, above 1 darkens them. */
  gamma?: number
  /**
   * Unsharp-mask amount applied after the tone curve (0 = off). Boosts local
   * contrast so eyes, brows and mouths survive the 1-bit pass.
   */
  sharpen?: number
  /** Box-blur radius in working pixels for the unsharp mask. */
  sharpenRadius?: number
  /** Percentiles used for the auto levels stretch, as fractions. */
  lowPercentile?: number
  highPercentile?: number
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * RGBA bytes -> 0..1 luminance (Rec. 709 weights on sRGB values).
 * Applies an auto levels stretch between the 2nd and 98th percentile first,
 * then contrast around 0.5, then gamma. Fully transparent pixels count as paper (1).
 */
export function toGrayscale(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  opts: GrayscaleOptions = {},
): Float32Array {
  const {
    contrast = 1,
    gamma = 1,
    sharpen = 0,
    sharpenRadius = 2,
    lowPercentile = 0.02, highPercentile = 0.98 } = opts
  const n = w * h
  const out = new Float32Array(n)
  const hist = new Uint32Array(256)

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const a = data[o + 3] / 255
    const lum = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]
    // Composite over white so transparent PNGs read as paper.
    const v = lum * a + 255 * (1 - a)
    out[i] = v / 255
    hist[Math.round(v)]++
  }

  // Percentile levels.
  const pick = (p: number) => {
    const target = p * n
    let acc = 0
    for (let b = 0; b < 256; b++) {
      acc += hist[b]
      if (acc >= target) return b / 255
    }
    return 1
  }
  let lo = pick(lowPercentile)
  let hi = pick(highPercentile)
  if (hi - lo < 1 / 255) {
    lo = 0
    hi = 1
  }
  const span = hi - lo

  for (let i = 0; i < n; i++) {
    let v = (out[i] - lo) / span
    v = (v - 0.5) * contrast + 0.5
    v = clamp01(v)
    if (gamma !== 1) v = Math.pow(v, gamma)
    out[i] = v
  }

  if (sharpen > 0) unsharp(out, w, h, sharpen, sharpenRadius)
  return out
}

/** Separable box blur (radius r) of `src`, written into a new array. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const dst = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0
      let c = 0
      for (let k = -r; k <= r; k++) {
        const xx = x + k
        if (xx >= 0 && xx < w) {
          s += src[y * w + xx]
          c++
        }
      }
      tmp[y * w + x] = s / c
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0
      let c = 0
      for (let k = -r; k <= r; k++) {
        const yy = y + k
        if (yy >= 0 && yy < h) {
          s += tmp[yy * w + x]
          c++
        }
      }
      dst[y * w + x] = s / c
    }
  }
  return dst
}

function unsharp(px: Float32Array, w: number, h: number, amount: number, radius: number) {
  const blur = boxBlur(px, w, h, Math.max(1, Math.round(radius)))
  for (let i = 0; i < px.length; i++) {
    px[i] = clamp01(px[i] + amount * (px[i] - blur[i]))
  }
}

/**
 * Atkinson error diffusion. Spreads 6/8 of the quantisation error to six
 * neighbours (1/8 each), which drops the rest and gives the punchy,
 * clean-highlight look of early Mac print. Returns 1 for ink, 0 for paper.
 */
export function atkinsonDither(
  gray: Float32Array,
  w: number,
  h: number,
  threshold = 0.5,
): Uint8Array {
  const buf = Float32Array.from(gray)
  const out = new Uint8Array(w * h)

  const spread = (x: number, y: number, e: number) => {
    if (x < 0 || x >= w || y >= h) return
    buf[y * w + x] += e
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const old = buf[i]
      const paper = old >= threshold
      out[i] = paper ? 0 : 1
      const e = (old - (paper ? 1 : 0)) / 8
      spread(x + 1, y, e)
      spread(x + 2, y, e)
      spread(x - 1, y + 1, e)
      spread(x, y + 1, e)
      spread(x + 1, y + 1, e)
      spread(x, y + 2, e)
    }
  }
  return out
}

/**
 * Flood-fills the near-white studio backdrop inward from the image border.
 * Returns 1 for backdrop, 0 for subject. Used to keep the backdrop transparent
 * when a light ink is painted positive-on-dark. If the border isn't near-white
 * the whole image counts as subject.
 */
export function backdropMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  minLuma = 0.9,
  grow = 0,
): Uint8Array {
  const n = w * h
  const isLight = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    isLight[i] = data[o + 3] < 128 || (luma >= minLuma && chroma < 0.12) ? 1 : 0
  }

  const mask = new Uint8Array(n)
  const stack: number[] = []
  const seed = (i: number) => {
    if (isLight[i] && !mask[i]) {
      mask[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }
  while (stack.length) {
    const i = stack.pop() as number
    const x = i % w
    if (x > 0) seed(i - 1)
    if (x < w - 1) seed(i + 1)
    if (i >= w) seed(i - w)
    if (i < n - w) seed(i + w)
  }

  // Optionally grow the backdrop into the anti-aliased edge. Off by default: the
  // thin light rim it would remove is what keeps dark hair readable on dark paper.
  for (let pass = 0; pass < grow; pass++) {
    const prev = mask.slice()
    for (let i = 0; i < n; i++) {
      if (prev[i]) continue
      const x = i % w
      if (
        (x > 0 && prev[i - 1]) ||
        (x < w - 1 && prev[i + 1]) ||
        (i >= w && prev[i - w]) ||
        (i < n - w && prev[i + w])
      ) {
        mask[i] = 1
      }
    }
  }
  return mask
}

/** Source rectangle for a square cover crop biased toward the top of a portrait. */
export function squareCoverCrop(
  sw: number,
  sh: number,
  topBias = 0.15,
): { sx: number; sy: number; side: number } {
  const side = Math.min(sw, sh)
  const sx = (sw - side) / 2
  const sy = sh > sw ? (sh - side) * topBias : 0
  return { sx, sy, side }
}

/**
 * Tuned against basketball-reference headshots (120x180 JPEGs on white):
 * a strong midtone lift (gamma 0.5) keeps darker skin from collapsing to
 * solid ink under Atkinson's dropped error, and the unsharp mask holds eyes,
 * brows and mouths at 60–120 working pixels.
 */
export const HEADSHOT_TONE = { contrast: 1.1, gamma: 0.5, sharpen: 1.8 } as const
export const HEADSHOT_THRESHOLD = 0.5

/**
 * Working (dither) resolution for a frame of `size` CSS px, given the side of
 * the source crop. Large frames get 2 CSS px cells for a chunky print look;
 * small frames keep 1 px cells so faces stay readable. Never upsamples past
 * the source crop.
 */
export function workingResolution(size: number, sourceSide: number): number {
  const pixelScale = size >= 180 ? 2 : 1
  return Math.max(16, Math.min(Math.round(size / pixelScale), Math.floor(sourceSide)))
}

/** Unsharp radius in working pixels, scaled with resolution (about 3 at 120). */
export function sharpenRadiusFor(working: number): number {
  return Math.max(1, Math.round(working / 40))
}
