import type { Timeline } from '../core/timeline'
import type { Track, EasingType, BuiltInEasingType, Keyframe, AnimatableValue } from '../types'
import { isCubicBezierEasing } from '../types'

/**
 * CSS export options
 */
export interface CSSExportOptions {
  /** Class name prefix for generated selectors */
  classPrefix?: string
  /** Whether to include @keyframes declarations */
  includeKeyframes?: boolean
  /** Whether to include animation shorthand properties */
  includeAnimation?: boolean
  /** Whether to minify the output */
  minify?: boolean
  /** Custom property mappings (e.g., 'x' -> 'left') */
  propertyMap?: Record<string, string>
}

/**
 * Exported CSS result
 */
export interface CSSExportResult {
  /** Full CSS output string */
  css: string
  /** Individual keyframes by animation name */
  keyframes: Map<string, string>
  /** Individual selectors with animation properties */
  selectors: Map<string, string>
}

/**
 * Map tinyfly easing names to CSS timing functions
 */
const easingToCss: Record<BuiltInEasingType, string> = {
  'linear': 'linear',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'ease-in-quad': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  'ease-out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'ease-in-out-quad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  'ease-in-cubic': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  'ease-out-cubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  'ease-in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
}

/**
 * Convert any EasingType to CSS timing function string
 */
function easingToCSS(easing: EasingType): string {
  if (isCubicBezierEasing(easing)) {
    const [cp1x, cp1y, cp2x, cp2y] = easing.points
    return `cubic-bezier(${cp1x}, ${cp1y}, ${cp2x}, ${cp2y})`
  }
  return easingToCss[easing]
}

/**
 * Map tinyfly property names to CSS property names
 */
const defaultPropertyMap: Record<string, string> = {
  x: 'left',
  y: 'top',
  width: 'width',
  height: 'height',
  opacity: 'opacity',
  rotate: 'rotate',
  scale: 'scale',
  scaleX: 'scaleX',
  scaleY: 'scaleY',
  fill: 'background-color',
  stroke: 'border-color',
  strokeWidth: 'border-width',
  borderRadius: 'border-radius',
  fontSize: 'font-size',
}

/**
 * Properties that should use transform
 */
const transformProperties = new Set(['x', 'y', 'rotate', 'scale', 'scaleX', 'scaleY'])

/**
 * Format a value for CSS output
 */
function formatValue(property: string, value: AnimatableValue): string {
  if (typeof value === 'number') {
    // Add units based on property
    if (property === 'opacity' || property === 'scale' || property === 'scaleX' || property === 'scaleY') {
      return String(value)
    }
    if (property === 'rotate') {
      return `${value}deg`
    }
    return `${value}px`
  }
  return String(value)
}

/**
 * Group tracks by target for CSS generation
 */
function groupTracksByTarget(tracks: Track[]): Map<string, Track[]> {
  const groups = new Map<string, Track[]>()
  for (const track of tracks) {
    const existing = groups.get(track.target) ?? []
    existing.push(track)
    groups.set(track.target, existing)
  }
  return groups
}

/**
 * Get all unique time points from keyframes
 */
function getTimePoints(tracks: Track[], duration: number): number[] {
  const times = new Set<number>()
  for (const track of tracks) {
    for (const kf of track.keyframes) {
      times.add(kf.time)
    }
  }
  // Ensure we have 0% and 100%
  times.add(0)
  times.add(duration)
  return Array.from(times).sort((a, b) => a - b)
}

/**
 * Get value at a specific time from a track
 */
function getValueAtTime(track: Track, time: number): AnimatableValue | null {
  const keyframes = track.keyframes
  if (keyframes.length === 0) return null

  // Find surrounding keyframes
  let prev: Keyframe | null = null
  let next: Keyframe | null = null

  for (const kf of keyframes) {
    if (kf.time <= time) {
      prev = kf
    }
    if (kf.time >= time && !next) {
      next = kf
    }
  }

  // Exact match or only prev
  if (prev && prev.time === time) return prev.value
  if (next && next.time === time) return next.value
  if (prev && !next) return prev.value
  if (!prev && next) return next.value

  // For CSS export, we use keyframes at exact points, so return null for interpolation
  return prev?.value ?? null
}

/**
 * Check if property requires transform
 */
function isTransformProperty(property: string): boolean {
  return transformProperties.has(property)
}

/**
 * Generate CSS @keyframes from tracks
 */
function generateKeyframes(
  animationName: string,
  tracks: Track[],
  duration: number,
  options: CSSExportOptions
): string {
  const propertyMap = { ...defaultPropertyMap, ...options.propertyMap }
  const timePoints = getTimePoints(tracks, duration)
  const lines: string[] = []
  const indent = options.minify ? '' : '  '
  const newline = options.minify ? '' : '\n'
  const space = options.minify ? '' : ' '

  lines.push(`@keyframes ${animationName}${space}{`)

  for (const time of timePoints) {
    const percentage = duration > 0 ? Math.round((time / duration) * 100) : 0
    const properties: string[] = []
    const transforms: string[] = []

    for (const track of tracks) {
      const value = getValueAtTime(track, time)
      if (value === null) continue

      const cssProperty = propertyMap[track.property] ?? track.property
      const formattedValue = formatValue(track.property, value)

      if (isTransformProperty(track.property)) {
        // Build transform value
        switch (track.property) {
          case 'x':
            transforms.push(`translateX(${formattedValue})`)
            break
          case 'y':
            transforms.push(`translateY(${formattedValue})`)
            break
          case 'rotate':
            transforms.push(`rotate(${formattedValue})`)
            break
          case 'scale':
            transforms.push(`scale(${value})`)
            break
          case 'scaleX':
            transforms.push(`scaleX(${value})`)
            break
          case 'scaleY':
            transforms.push(`scaleY(${value})`)
            break
        }
      } else {
        properties.push(`${cssProperty}:${space}${formattedValue}`)
      }
    }

    // Add combined transform if any
    if (transforms.length > 0) {
      properties.push(`transform:${space}${transforms.join(' ')}`)
    }

    if (properties.length > 0) {
      lines.push(`${indent}${percentage}%${space}{${space}${properties.join(`;${space}`)}${space}}`)
    }
  }

  lines.push('}')

  return lines.join(newline)
}

/**
 * Get the dominant easing from tracks (most common easing)
 */
function getDominantEasing(tracks: Track[]): EasingType {
  const counts = new Map<EasingType, number>()

  for (const track of tracks) {
    for (const kf of track.keyframes) {
      const easing = kf.easing ?? 'linear'
      counts.set(easing, (counts.get(easing) ?? 0) + 1)
    }
  }

  let maxCount = 0
  let dominant: EasingType = 'linear'

  for (const [easing, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      dominant = easing
    }
  }

  return dominant
}

/**
 * Generate animation property for a selector
 */
function generateAnimationProperty(
  animationName: string,
  duration: number,
  tracks: Track[],
  config: { loop?: number; alternate?: boolean },
  options: CSSExportOptions
): string {
  const space = options.minify ? '' : ' '
  const durationSec = (duration / 1000).toFixed(2)
  const easing = easingToCSS(getDominantEasing(tracks))
  const iterationCount = config.loop === -1 ? 'infinite' : config.loop ? config.loop + 1 : 1
  const direction = config.alternate ? 'alternate' : 'normal'

  return `animation:${space}${animationName} ${durationSec}s ${easing} ${iterationCount} ${direction}`
}

/**
 * Export a timeline to CSS keyframes and animation properties.
 */
export function exportToCSS(timeline: Timeline, options: CSSExportOptions = {}): CSSExportResult {
  const {
    classPrefix = 'tinyfly',
    includeKeyframes = true,
    includeAnimation = true,
    minify = false,
  } = options

  const keyframes = new Map<string, string>()
  const selectors = new Map<string, string>()
  const cssBlocks: string[] = []
  const newline = minify ? '' : '\n'
  const space = minify ? '' : ' '

  const duration = timeline.duration
  const config = {
    loop: timeline['_config'].loop,
    alternate: timeline['_config'].alternate,
  }

  // Group tracks by target
  const trackGroups = groupTracksByTarget(timeline.tracks)

  for (const [target, tracks] of trackGroups) {
    // Generate unique animation name
    const animationName = `${classPrefix}-${target.replace(/[^a-zA-Z0-9]/g, '-')}`

    // Generate keyframes
    if (includeKeyframes) {
      const keyframeCSS = generateKeyframes(animationName, tracks, duration, options)
      keyframes.set(animationName, keyframeCSS)
      cssBlocks.push(keyframeCSS)
    }

    // Generate selector with animation property
    if (includeAnimation) {
      const animationProp = generateAnimationProperty(animationName, duration, tracks, config, options)
      const selector = `.${classPrefix}-${target.replace(/[^a-zA-Z0-9]/g, '-')}`
      const selectorCSS = `${selector}${space}{${newline}${minify ? '' : '  '}${animationProp};${newline}}`
      selectors.set(target, selectorCSS)
      cssBlocks.push(selectorCSS)
    }
  }

  return {
    css: cssBlocks.join(newline + newline),
    keyframes,
    selectors,
  }
}
