/**
 * Colour quantization for palette-based formats (GIF).
 *
 * Reduces a truecolour image to an N-entry palette using median cut, then maps
 * every pixel to a palette index — optionally with Floyd-Steinberg dithering.
 *
 * Pure functions over plain typed arrays: no DOM, no canvas, no globals. The
 * same input always produces the same palette, so exports stay deterministic.
 */

/** Bits of precision kept per channel when building the histogram. */
const HIST_BITS = 5
const HIST_SIZE = 1 << (HIST_BITS * 3) // 32768 buckets
const HIST_SHIFT = 8 - HIST_BITS

/** Pack an 8-bit RGB triple into a histogram bucket index. */
function bucketOf(r: number, g: number, b: number): number {
  return (
    ((r >> HIST_SHIFT) << (HIST_BITS * 2)) |
    ((g >> HIST_SHIFT) << HIST_BITS) |
    (b >> HIST_SHIFT)
  )
}

/** A colour cube being considered for splitting. */
interface Box {
  /** Indices into the distinct-colour list owned by this box. */
  from: number
  to: number
  /** Total pixel count inside the box. */
  count: number
  /** Channel extents, used to pick the split axis. */
  rMin: number
  rMax: number
  gMin: number
  gMax: number
  bMin: number
  bMax: number
}

export interface Palette {
  /** Flat RGB triples, `size * 3` bytes long. */
  rgb: Uint8Array
  /** Number of colours actually produced (may be fewer than requested). */
  size: number
}

/**
 * Build a palette of at most `maxColors` entries from RGBA pixel data.
 * Fully transparent pixels are ignored — they get their own reserved index.
 */
export function buildPalette(data: Uint8ClampedArray | Uint8Array, maxColors: number): Palette {
  const counts = new Uint32Array(HIST_SIZE)
  const sumR = new Uint32Array(HIST_SIZE)
  const sumG = new Uint32Array(HIST_SIZE)
  const sumB = new Uint32Array(HIST_SIZE)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue // transparent pixels don't influence the palette
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const bucket = bucketOf(r, g, b)
    counts[bucket]++
    sumR[bucket] += r
    sumG[bucket] += g
    sumB[bucket] += b
  }

  // Collapse the histogram to the buckets that actually occur, each represented
  // by the mean colour of the pixels that landed in it.
  const colors: { r: number; g: number; b: number; count: number }[] = []
  for (let bucket = 0; bucket < HIST_SIZE; bucket++) {
    const count = counts[bucket]
    if (count === 0) continue
    colors.push({
      r: Math.round(sumR[bucket] / count),
      g: Math.round(sumG[bucket] / count),
      b: Math.round(sumB[bucket] / count),
      count,
    })
  }

  if (colors.length === 0) {
    return { rgb: new Uint8Array(3), size: 1 }
  }
  if (colors.length <= maxColors) {
    const rgb = new Uint8Array(colors.length * 3)
    colors.forEach((c, i) => {
      rgb[i * 3] = c.r
      rgb[i * 3 + 1] = c.g
      rgb[i * 3 + 2] = c.b
    })
    return { rgb, size: colors.length }
  }

  const measure = (from: number, to: number): Box => {
    let count = 0
    let rMin = 255
    let rMax = 0
    let gMin = 255
    let gMax = 0
    let bMin = 255
    let bMax = 0
    for (let i = from; i <= to; i++) {
      const c = colors[i]
      count += c.count
      if (c.r < rMin) rMin = c.r
      if (c.r > rMax) rMax = c.r
      if (c.g < gMin) gMin = c.g
      if (c.g > gMax) gMax = c.g
      if (c.b < bMin) bMin = c.b
      if (c.b > bMax) bMax = c.b
    }
    return { from, to, count, rMin, rMax, gMin, gMax, bMin, bMax }
  }

  const boxes: Box[] = [measure(0, colors.length - 1)]

  while (boxes.length < maxColors) {
    // Split the box with the largest pixel population and room to divide.
    let target = -1
    let best = 0
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      if (box.to <= box.from) continue
      if (box.count > best) {
        best = box.count
        target = i
      }
    }
    if (target === -1) break

    const box = boxes[target]
    const rSpan = box.rMax - box.rMin
    const gSpan = box.gMax - box.gMin
    const bSpan = box.bMax - box.bMin
    const axis = rSpan >= gSpan && rSpan >= bSpan ? 'r' : gSpan >= bSpan ? 'g' : 'b'

    const slice = colors.slice(box.from, box.to + 1)
    slice.sort((a, b) => a[axis] - b[axis])
    for (let i = 0; i < slice.length; i++) colors[box.from + i] = slice[i]

    // Cut at the weighted median so both halves carry a similar pixel count.
    const half = box.count / 2
    let running = 0
    let cut = box.from
    for (let i = box.from; i < box.to; i++) {
      running += colors[i].count
      cut = i
      if (running >= half) break
    }

    boxes[target] = measure(box.from, cut)
    boxes.push(measure(cut + 1, box.to))
  }

  const rgb = new Uint8Array(boxes.length * 3)
  boxes.forEach((box, i) => {
    // Palette entry = pixel-weighted average of the colours in the box.
    let total = 0
    let r = 0
    let g = 0
    let b = 0
    for (let j = box.from; j <= box.to; j++) {
      const c = colors[j]
      total += c.count
      r += c.r * c.count
      g += c.g * c.count
      b += c.b * c.count
    }
    if (total === 0) total = 1
    rgb[i * 3] = Math.round(r / total)
    rgb[i * 3 + 1] = Math.round(g / total)
    rgb[i * 3 + 2] = Math.round(b / total)
  })

  return { rgb, size: boxes.length }
}

/**
 * Nearest-palette-colour lookup with a bounded cache.
 *
 * A linear scan over 256 colours per pixel is too slow for full-frame images, so
 * results are memoised per 5-bit RGB bucket — at most 32768 scans per frame.
 */
export class PaletteMatcher {
  private cache = new Int16Array(HIST_SIZE).fill(-1)
  private palette: Palette
  /** Palette index `n` is written as `n + offset` (GIF reserves index 0). */
  private offset: number

  constructor(palette: Palette, offset = 0) {
    this.palette = palette
    this.offset = offset
  }

  /** Index of the closest palette entry to the given colour. */
  nearest(r: number, g: number, b: number): number {
    const bucket = bucketOf(r, g, b)
    const cached = this.cache[bucket]
    if (cached !== -1) return cached

    const { rgb, size } = this.palette
    let bestDist = Infinity
    let best = 0
    for (let i = 0; i < size; i++) {
      const dr = r - rgb[i * 3]
      const dg = g - rgb[i * 3 + 1]
      const db = b - rgb[i * 3 + 2]
      const dist = dr * dr + dg * dg + db * db
      if (dist < bestDist) {
        bestDist = dist
        best = i
        if (dist === 0) break
      }
    }

    const index = best + this.offset
    this.cache[bucket] = index
    return index
  }

  /** The colour actually stored at a palette index produced by `nearest`. */
  colorAt(index: number): [number, number, number] {
    const i = (index - this.offset) * 3
    return [this.palette.rgb[i], this.palette.rgb[i + 1], this.palette.rgb[i + 2]]
  }
}

export interface QuantizeOptions {
  /** Spread quantization error into neighbouring pixels (default true). */
  dither?: boolean
  /** Index reserved for fully transparent pixels; palette starts at `+1`. */
  transparentIndex?: number
}

export interface QuantizedImage {
  /** One palette index per pixel. */
  indices: Uint8Array
  /** Whether any pixel used the transparent index. */
  hasTransparency: boolean
}

/**
 * Map every pixel of an RGBA image onto `palette`, writing one index per pixel.
 *
 * With dithering on, this runs Floyd-Steinberg error diffusion over a scratch
 * copy of the image so the input is left untouched.
 */
export function quantizeImage(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  palette: Palette,
  options: QuantizeOptions = {}
): QuantizedImage {
  const { dither = true, transparentIndex = 0 } = options
  const matcher = new PaletteMatcher(palette, transparentIndex + 1)
  const indices = new Uint8Array(width * height)
  let hasTransparency = false

  if (!dither) {
    for (let p = 0; p < width * height; p++) {
      const i = p * 4
      if (data[i + 3] < 128) {
        indices[p] = transparentIndex
        hasTransparency = true
        continue
      }
      indices[p] = matcher.nearest(data[i], data[i + 1], data[i + 2])
    }
    return { indices, hasTransparency }
  }

  // Float scratch buffer so diffused error isn't clamped between pixels.
  const buf = new Float32Array(width * height * 3)
  for (let p = 0; p < width * height; p++) {
    buf[p * 3] = data[p * 4]
    buf[p * 3 + 1] = data[p * 4 + 1]
    buf[p * 3 + 2] = data[p * 4 + 2]
  }

  const spread = (p: number, er: number, eg: number, eb: number, factor: number) => {
    buf[p * 3] += er * factor
    buf[p * 3 + 1] += eg * factor
    buf[p * 3 + 2] += eb * factor
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x
      if (data[p * 4 + 3] < 128) {
        indices[p] = transparentIndex
        hasTransparency = true
        continue
      }

      const r = Math.max(0, Math.min(255, buf[p * 3]))
      const g = Math.max(0, Math.min(255, buf[p * 3 + 1]))
      const b = Math.max(0, Math.min(255, buf[p * 3 + 2]))

      const index = matcher.nearest(r, g, b)
      indices[p] = index

      const [pr, pg, pb] = matcher.colorAt(index)
      const er = r - pr
      const eg = g - pg
      const eb = b - pb

      // Floyd-Steinberg: 7/16 right, 3/16 below-left, 5/16 below, 1/16 below-right.
      if (x + 1 < width) spread(p + 1, er, eg, eb, 7 / 16)
      if (y + 1 < height) {
        if (x > 0) spread(p + width - 1, er, eg, eb, 3 / 16)
        spread(p + width, er, eg, eb, 5 / 16)
        if (x + 1 < width) spread(p + width + 1, er, eg, eb, 1 / 16)
      }
    }
  }

  return { indices, hasTransparency }
}
