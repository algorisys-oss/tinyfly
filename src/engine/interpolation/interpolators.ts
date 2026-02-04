import type { AnimatableValue, Interpolator } from '../types'

/**
 * Interpolate between two numbers.
 */
export const interpolateNumber: Interpolator<number> = (from, to, progress) => {
  return from + (to - from) * progress
}

/**
 * Parse a hex color string to RGB values.
 */
function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  return [r, g, b]
}

/**
 * Convert RGB values to hex string.
 */
function toHex(r: number, g: number, b: number): string {
  const toHexPart = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
}

/**
 * Parse rgb() or rgba() color string.
 */
function parseRgb(
  color: string
): [number, number, number] | [number, number, number, number] {
  const match = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  )
  if (!match) {
    throw new Error(`Invalid rgb color: ${color}`)
  }
  const r = parseInt(match[1], 10)
  const g = parseInt(match[2], 10)
  const b = parseInt(match[3], 10)
  if (match[4] !== undefined) {
    return [r, g, b, parseFloat(match[4])]
  }
  return [r, g, b]
}

/**
 * Interpolate between two color strings (hex or rgb/rgba).
 */
export const interpolateColor: Interpolator<string> = (from, to, progress) => {
  const isHex = (s: string) => s.startsWith('#')
  const isRgba = (s: string) => s.startsWith('rgba')
  const isRgb = (s: string) => s.startsWith('rgb')

  if (isHex(from) && isHex(to)) {
    const [r1, g1, b1] = parseHex(from)
    const [r2, g2, b2] = parseHex(to)
    const r = interpolateNumber(r1, r2, progress)
    const g = interpolateNumber(g1, g2, progress)
    const b = interpolateNumber(b1, b2, progress)
    return toHex(r, g, b)
  }

  if ((isRgb(from) || isRgba(from)) && (isRgb(to) || isRgba(to))) {
    const fromParts = parseRgb(from)
    const toParts = parseRgb(to)

    const r = Math.round(interpolateNumber(fromParts[0], toParts[0], progress))
    const g = Math.round(interpolateNumber(fromParts[1], toParts[1], progress))
    const b = Math.round(interpolateNumber(fromParts[2], toParts[2], progress))

    if (fromParts.length === 4 || toParts.length === 4) {
      const a1 = fromParts[3] ?? 1
      const a2 = toParts[3] ?? 1
      const a = interpolateNumber(a1, a2, progress)
      return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    return `rgb(${r}, ${g}, ${b})`
  }

  // Fallback: return from or to based on progress
  return progress < 1 ? from : to
}

/**
 * Interpolate between two number arrays (element-wise).
 */
export const interpolateArray: Interpolator<number[]> = (from, to, progress) => {
  const length = Math.min(from.length, to.length)
  const result: number[] = []
  for (let i = 0; i < length; i++) {
    result.push(interpolateNumber(from[i], to[i], progress))
  }
  return result
}

/**
 * Interpolate strings with no interpolation (discrete jump).
 */
export const interpolateString: Interpolator<string> = (from, to, progress) => {
  return progress < 1 ? from : to
}

/**
 * Detect value type and return appropriate interpolator.
 */
export function getInterpolator<T extends AnimatableValue>(
  sampleValue: T
): Interpolator<T> {
  if (typeof sampleValue === 'number') {
    return interpolateNumber as unknown as Interpolator<T>
  }

  if (Array.isArray(sampleValue)) {
    return interpolateArray as unknown as Interpolator<T>
  }

  if (typeof sampleValue === 'string') {
    // Check if it's a color
    if (
      sampleValue.startsWith('#') ||
      sampleValue.startsWith('rgb')
    ) {
      return interpolateColor as unknown as Interpolator<T>
    }
    return interpolateString as unknown as Interpolator<T>
  }

  // Fallback to discrete
  return interpolateString as unknown as Interpolator<T>
}
