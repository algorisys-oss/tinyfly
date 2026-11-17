/**
 * Small pure helpers shared by the cosmic explainer kit: colour parsing and
 * shading (lighter / darker variants for flat-shaded shapes) and easing for
 * camera zooms. Nothing here keeps state.
 */
import { clamp01, smooth } from '../noir/noir-utils'

export { clamp01, smooth }

/** An `[r, g, b]` triple, 0..255. */
export type RgbTriple = [number, number, number]

/**
 * Parse `#rgb`, `#rrggbb`, `rgb()` or `rgba()` into an `[r, g, b]` triple.
 * Anything else throws: the kit shades colours, so it has to know them.
 */
export function parseRgb(color: string): RgbTriple {
  const c = color.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)?.[1]
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((h) => h + h).join('') : hex
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RgbTriple
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(c)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  throw new Error(`cosmic kit: cannot read the colour "${color}" (use #rgb, #rrggbb or rgb())`)
}

/** `rgba(r,g,b,a)` from a triple. */
export function rgba([r, g, b]: RgbTriple, alpha = 1): string {
  const round = (v: number) => Math.round(Math.min(255, Math.max(0, v)))
  return `rgba(${round(r)},${round(g)},${round(b)},${Math.round(clamp01(alpha) * 1000) / 1000})`
}

/**
 * A colour shaded toward black (`amount` < 0) or white (`amount` > 0),
 * |amount| up to 1. The flat-shading look: one base colour, a darker side,
 * a lighter highlight.
 */
export function shade(color: string, amount: number, alpha = 1): string {
  const [r, g, b] = parseRgb(color)
  const k = Math.max(-1, Math.min(1, amount))
  const mix = (v: number) => (k < 0 ? v * (1 + k) : v + (255 - v) * k)
  return rgba([mix(r), mix(g), mix(b)], alpha)
}

/** Ease in-out on 0..1 (smoothstep). */
export const easeInOut = smooth

/** Deterministic 0..1 hash of an integer pair: the same particle lands in the same place every frame. */
export function hash01(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return v - Math.floor(v)
}
