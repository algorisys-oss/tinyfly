import { parseColor } from '../../scene-3d/shading'

/**
 * Painted tones for one fill colour, as an illustrator mixes them: shadows
 * are not the fill with black added but deeper, more saturated and shifted
 * toward red-violet (warm skin shades into rose, not grey); highlights are
 * lighter and shifted toward a warm yellow. Pure functions of the colour.
 */
export interface IllustrationTones {
  shadow: string
  core: string
  highlight: string
}

type Hsl = [number, number, number]

function toHsl([r, g, b]: [number, number, number]): Hsl {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

function toCss([h, s, l]: Hsl): string {
  const hue = ((h % 360) + 360) % 360
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return `hsl(${hue.toFixed(1)}, ${(clamp(s) * 100).toFixed(1)}%, ${(clamp(l) * 100).toFixed(1)}%)`
}

/** Turn `hue` toward `target` by at most `degrees`, the short way round. */
function hueToward(hue: number, target: number, degrees: number): number {
  const delta = ((target - hue + 540) % 360) - 180
  return hue + Math.sign(delta) * Math.min(Math.abs(delta), degrees)
}

const SHADOW_HUE = 335 // red-violet
const LIGHT_HUE = 50 // warm yellow

const CACHE = new Map<string, IllustrationTones>()

/** The shadow, core-shadow and highlight tones for a fill; undefined for a fill that is not a colour. */
export function illustrationTones(fill: string): IllustrationTones | undefined {
  const cached = CACHE.get(fill)
  if (cached) return cached
  const trimmed = fill.trim()
  // Only opaque colours: a translucent fill (a sheen, a glow) is light itself, not a surface.
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) && !trimmed.startsWith('rgb(')) return undefined
  const [h, s, l] = toHsl(parseColor(trimmed))
  // Greys have no hue of their own to shift: their shadow leans cool instead.
  const grey = s < 0.08
  const tones: IllustrationTones = {
    shadow: toCss(grey ? [230, 0.1, l * 0.82] : [hueToward(h, SHADOW_HUE, 8), s * 0.82 + 0.02, l * 0.8]),
    core: toCss(grey ? [235, 0.14, l * 0.66] : [hueToward(h, SHADOW_HUE, 14), s * 0.85 + 0.04, l * 0.64]),
    highlight: toCss(grey ? [h, s, l + (1 - l) * 0.5] : [hueToward(h, LIGHT_HUE, 8), s * 0.9, l + (1 - l) * 0.4]),
  }
  if (CACHE.size < 512) CACHE.set(fill, tones)
  return tones
}
