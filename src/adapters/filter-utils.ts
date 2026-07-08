/**
 * Shared composition of animatable CSS/Canvas filters.
 *
 * The engine animates plain numeric (and color) properties; adapters collect the
 * filter-related ones and compose a single `filter` string. Keeping this in one
 * place means DOM, SVG, and Canvas render filters identically.
 */

/** Property names that feed the composed filter. */
export const FILTER_PROPERTIES = new Set([
  'blur',
  'brightness',
  'glow',
  'glowColor',
  'shadowX',
  'shadowY',
  'shadowBlur',
  'shadowColor',
])

export interface FilterValues {
  /** Gaussian blur radius in px. */
  blur?: number
  /** Brightness multiplier (1 = unchanged). */
  brightness?: number
  /** Glow radius in px (rendered as a coloured drop-shadow with no offset). */
  glow?: number
  /** Glow colour (defaults to white). */
  glowColor?: string
  /** Drop-shadow horizontal offset in px. */
  shadowX?: number
  /** Drop-shadow vertical offset in px. */
  shadowY?: number
  /** Drop-shadow blur radius in px. */
  shadowBlur?: number
  /** Drop-shadow colour (defaults to semi-transparent black). */
  shadowColor?: string
}

const DEFAULT_GLOW_COLOR = '#ffffff'
const DEFAULT_SHADOW_COLOR = 'rgba(0, 0, 0, 0.5)'

/**
 * Compose a CSS `filter` value from animatable filter properties.
 * Returns null when no filter properties are present.
 */
export function composeFilter(v: FilterValues): string | null {
  const parts: string[] = []

  if (v.blur !== undefined) {
    parts.push(`blur(${Math.max(0, v.blur)}px)`)
  }
  if (v.brightness !== undefined) {
    parts.push(`brightness(${Math.max(0, v.brightness)})`)
  }
  if (v.glow !== undefined) {
    parts.push(`drop-shadow(0 0 ${Math.max(0, v.glow)}px ${v.glowColor ?? DEFAULT_GLOW_COLOR})`)
  }
  if (v.shadowX !== undefined || v.shadowY !== undefined || v.shadowBlur !== undefined) {
    const x = v.shadowX ?? 0
    const y = v.shadowY ?? 0
    const blur = Math.max(0, v.shadowBlur ?? 0)
    parts.push(`drop-shadow(${x}px ${y}px ${blur}px ${v.shadowColor ?? DEFAULT_SHADOW_COLOR})`)
  }

  return parts.length > 0 ? parts.join(' ') : null
}
