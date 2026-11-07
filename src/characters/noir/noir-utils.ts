/**
 * Small pure helpers shared by the noir / detective kit: timing windows,
 * easing, colours with an alpha, and word wrapping. Nothing here keeps state.
 */

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0))

/** Smoothstep 0..1. */
export const smooth = (k: number): number => {
  const t = clamp01(k)
  return t * t * (3 - 2 * t)
}

/** Progress 0..1 of `time` through [start, start + length]. */
export const progressIn = (time: number, start: number, length: number): number => (length <= 0 ? (time >= start ? 1 : 0) : clamp01((time - start) / length))

/** A back-out pop 0..1 that overshoots a little before settling (cards pinned, a marker appearing). */
export function popIn(k: number): number {
  const t = clamp01(k)
  if (t === 0 || t === 1) return t
  const s = 1.70158
  const u = t - 1
  return 1 + (s + 1) * u * u * u + s * u * u
}

/**
 * How visible something is at `time` that appears at `at` and lasts
 * `duration` ms: it fades in over `fadeIn`, holds, and fades out over the
 * last `fadeOut` ms (0 outside the window).
 */
export function fadeWindow(time: number, at: number, duration: number, fadeIn = 300, fadeOut = 300): number {
  if (!(time >= at && time <= at + duration)) return 0
  return smooth(progressIn(time, at, fadeIn)) * (1 - smooth(progressIn(time, at + duration - fadeOut, fadeOut)))
}

/** Any `#rgb`, `#rrggbb`, `rgb()` or `rgba()` colour with its alpha multiplied by `alpha` (other forms come back as they are). */
export function withAlpha(color: string, alpha: number): string {
  const a = clamp01(alpha)
  const c = color.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)?.[1]
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((h) => h + h).join('') : hex
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
    return `rgba(${r},${g},${b},${round(a)})`
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c)
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${round(a * (rgb[4] === undefined ? 1 : Number(rgb[4])))})`
  return c
}

const round = (v: number) => Math.round(v * 1000) / 1000

/**
 * Break text into lines no wider than `maxWidth` in the context's current
 * font, at spaces (an explicit `\n` always breaks). A single word wider than
 * the line stays whole.
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line)
        line = word
      } else line = next
    }
    lines.push(line)
  }
  return lines
}

/** A rounded rectangle path (no fill or stroke). */
export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  ctx.lineTo(x + rr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
  ctx.lineTo(x, y + rr)
  ctx.quadraticCurveTo(x, y, x + rr, y)
  ctx.closePath()
}

/** A CSS font string: `weight size family`. */
export const fontOf = (size: number, weight: string | number, family: string): string => `${weight} ${Math.round(size)}px ${family}`

/** The default font family for the kit's text (any CSS family list works). */
export const NOIR_FONT = 'system-ui, sans-serif'
