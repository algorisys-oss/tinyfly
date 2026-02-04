import type { Timeline } from '../core/timeline'
import type { Track, Keyframe, EasingType, BuiltInEasingType, AnimatableValue } from '../types'
import { isCubicBezierEasing } from '../types'

/**
 * Lottie export options
 */
export interface LottieExportOptions {
  /** Animation name */
  name?: string
  /** Frame rate (default: 60) */
  frameRate?: number
  /** Canvas width (default: 512) */
  width?: number
  /** Canvas height (default: 512) */
  height?: number
  /** Background color (default: transparent) */
  backgroundColor?: string
}

/**
 * Lottie JSON structure (simplified)
 * Full spec: https://lottiefiles.github.io/lottie-docs/
 */
export interface LottieAnimation {
  v: string // Version
  nm: string // Name
  fr: number // Frame rate
  ip: number // In point (start frame)
  op: number // Out point (end frame)
  w: number // Width
  h: number // Height
  ddd: number // 3D (0 = 2D)
  assets: LottieAsset[]
  layers: LottieLayer[]
}

interface LottieAsset {
  id: string
  [key: string]: unknown
}

interface LottieLayer {
  ddd: number
  ind: number
  ty: number // Layer type (4 = shape)
  nm: string
  sr: number
  ks: LottieTransform
  ao: number
  shapes?: LottieShape[]
  ip: number
  op: number
  st: number
  bm: number
}

interface LottieTransform {
  o?: LottieAnimatedValue // Opacity
  r?: LottieAnimatedValue // Rotation
  p?: LottieAnimatedMultiValue // Position
  a?: LottieAnimatedMultiValue // Anchor point
  s?: LottieAnimatedMultiValue // Scale
}

interface LottieAnimatedValue {
  a: number // Animated (0 = static, 1 = animated)
  k: number | LottieKeyframe[]
}

interface LottieAnimatedMultiValue {
  a: number
  k: number[] | LottieMultiKeyframe[]
}

interface LottieKeyframe {
  t: number // Time (frame)
  s: number[] // Start value
  e?: number[] // End value
  i?: { x: number[]; y: number[] } // In tangent
  o?: { x: number[]; y: number[] } // Out tangent
}

interface LottieMultiKeyframe {
  t: number
  s: number[]
  e?: number[]
  i?: { x: number[]; y: number[] }
  o?: { x: number[]; y: number[] }
}

interface LottieShape {
  ty: string
  [key: string]: unknown
}

/**
 * Convert easing type to Lottie bezier tangents
 */
function easingToLottieTangents(easing: EasingType): { i: { x: number[]; y: number[] }; o: { x: number[]; y: number[] } } {
  // Default linear tangents
  const linear = {
    i: { x: [0.833], y: [0.833] },
    o: { x: [0.167], y: [0.167] },
  }

  // Handle custom cubic-bezier easing
  if (isCubicBezierEasing(easing)) {
    const [cp1x, cp1y, cp2x, cp2y] = easing.points
    return {
      i: { x: [cp1x], y: [cp1y] },
      o: { x: [cp2x], y: [cp2y] },
    }
  }

  const easings: Record<BuiltInEasingType, typeof linear> = {
    'linear': linear,
    'ease-in': {
      i: { x: [0.42], y: [0] },
      o: { x: [1], y: [1] },
    },
    'ease-out': {
      i: { x: [0], y: [0] },
      o: { x: [0.58], y: [1] },
    },
    'ease-in-out': {
      i: { x: [0.42], y: [0] },
      o: { x: [0.58], y: [1] },
    },
    'ease-in-quad': {
      i: { x: [0.55], y: [0.085] },
      o: { x: [0.68], y: [0.53] },
    },
    'ease-out-quad': {
      i: { x: [0.25], y: [0.46] },
      o: { x: [0.45], y: [0.94] },
    },
    'ease-in-out-quad': {
      i: { x: [0.455], y: [0.03] },
      o: { x: [0.515], y: [0.955] },
    },
    'ease-in-cubic': {
      i: { x: [0.55], y: [0.055] },
      o: { x: [0.675], y: [0.19] },
    },
    'ease-out-cubic': {
      i: { x: [0.215], y: [0.61] },
      o: { x: [0.355], y: [1] },
    },
    'ease-in-out-cubic': {
      i: { x: [0.645], y: [0.045] },
      o: { x: [0.355], y: [1] },
    },
  }

  return easings[easing] ?? linear
}

/**
 * Convert milliseconds to frame number
 */
function msToFrame(ms: number, frameRate: number): number {
  return Math.round((ms / 1000) * frameRate)
}

/**
 * Parse color string to RGB array [r, g, b] normalized to 0-1
 */
function parseColor(color: string): number[] {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255
      const g = parseInt(hex[1] + hex[1], 16) / 255
      const b = parseInt(hex[2] + hex[2], 16) / 255
      return [r, g, b]
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      return [r, g, b]
    }
  }
  // Default to black
  return [0, 0, 0]
}

/**
 * Convert keyframes to Lottie animated value format
 */
function keyframesToLottieValue(
  keyframes: Keyframe[],
  frameRate: number,
  isMultiDimensional: boolean = false
): LottieAnimatedValue | LottieAnimatedMultiValue {
  if (keyframes.length === 0) {
    if (isMultiDimensional) {
      return { a: 0, k: [0, 0] } as LottieAnimatedMultiValue
    }
    return { a: 0, k: 0 } as LottieAnimatedValue
  }

  if (keyframes.length === 1) {
    const value = keyframes[0].value
    if (isMultiDimensional && typeof value === 'number') {
      return { a: 0, k: [value, value] } as LottieAnimatedMultiValue
    }
    return { a: 0, k: value as number } as LottieAnimatedValue
  }

  // Animated
  const lottieKeyframes: LottieKeyframe[] = []

  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i]
    const nextKf = keyframes[i + 1]
    const frame = msToFrame(kf.time, frameRate)
    const value = typeof kf.value === 'number' ? [kf.value] : [0]

    const lkf: LottieKeyframe = {
      t: frame,
      s: value,
    }

    if (nextKf) {
      const nextValue = typeof nextKf.value === 'number' ? [nextKf.value] : [0]
      lkf.e = nextValue

      // Add easing tangents
      const easing = nextKf.easing ?? 'linear'
      const tangents = easingToLottieTangents(easing)
      lkf.i = tangents.i
      lkf.o = tangents.o
    }

    lottieKeyframes.push(lkf)
  }

  return { a: 1, k: lottieKeyframes }
}

/**
 * Group tracks by target
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
 * Create Lottie transform from tracks
 */
function createLottieTransform(
  tracks: Track[],
  frameRate: number
): LottieTransform {
  const transform: LottieTransform = {
    o: { a: 0, k: 100 }, // Default opacity
    r: { a: 0, k: 0 }, // Default rotation
    p: { a: 0, k: [0, 0] }, // Default position
    a: { a: 0, k: [0, 0] }, // Default anchor
    s: { a: 0, k: [100, 100] }, // Default scale
  }

  for (const track of tracks) {
    const keyframes = track.keyframes

    switch (track.property) {
      case 'opacity':
        // Lottie opacity is 0-100
        const opacityKfs = keyframes.map(kf => ({
          ...kf,
          value: (kf.value as number) * 100,
        }))
        transform.o = keyframesToLottieValue(opacityKfs, frameRate) as LottieAnimatedValue
        break

      case 'rotate':
      case 'rotation':
        transform.r = keyframesToLottieValue(keyframes, frameRate) as LottieAnimatedValue
        break

      case 'scale':
        // Lottie scale is percentage
        const scaleKfs = keyframes.map(kf => ({
          ...kf,
          value: (kf.value as number) * 100,
        }))
        transform.s = keyframesToLottieValue(scaleKfs, frameRate, true) as LottieAnimatedMultiValue
        break

      case 'x':
      case 'y':
        // Position handled separately (need to combine x and y)
        break
    }
  }

  // Handle position (combine x and y tracks)
  const xTrack = tracks.find(t => t.property === 'x')
  const yTrack = tracks.find(t => t.property === 'y')

  if (xTrack || yTrack) {
    const xKeyframes = xTrack?.keyframes ?? [{ time: 0, value: 0 }]
    const yKeyframes = yTrack?.keyframes ?? [{ time: 0, value: 0 }]

    // Get all time points
    const times = new Set<number>()
    xKeyframes.forEach(kf => times.add(kf.time))
    yKeyframes.forEach(kf => times.add(kf.time))
    const sortedTimes = Array.from(times).sort((a, b) => a - b)

    if (sortedTimes.length === 1) {
      const x = xKeyframes[0]?.value ?? 0
      const y = yKeyframes[0]?.value ?? 0
      transform.p = { a: 0, k: [x as number, y as number] }
    } else {
      const posKeyframes: LottieMultiKeyframe[] = []

      for (let i = 0; i < sortedTimes.length; i++) {
        const time = sortedTimes[i]
        const nextTime = sortedTimes[i + 1]

        const xVal = getValueAtTime(xKeyframes, time) as number
        const yVal = getValueAtTime(yKeyframes, time) as number

        const posKf: LottieMultiKeyframe = {
          t: msToFrame(time, frameRate),
          s: [xVal, yVal],
        }

        if (nextTime !== undefined) {
          const nextX = getValueAtTime(xKeyframes, nextTime) as number
          const nextY = getValueAtTime(yKeyframes, nextTime) as number
          posKf.e = [nextX, nextY]

          // Get easing from the next keyframe
          const xNextKf = xKeyframes.find(kf => kf.time === nextTime)
          const easing = xNextKf?.easing ?? 'linear'
          const tangents = easingToLottieTangents(easing)
          posKf.i = tangents.i
          posKf.o = tangents.o
        }

        posKeyframes.push(posKf)
      }

      transform.p = { a: 1, k: posKeyframes }
    }
  }

  return transform
}

/**
 * Get value at time from keyframes (simple interpolation for export)
 */
function getValueAtTime(keyframes: Keyframe[], time: number): AnimatableValue {
  if (keyframes.length === 0) return 0

  // Find surrounding keyframes
  let prev = keyframes[0]
  let next = keyframes[keyframes.length - 1]

  for (const kf of keyframes) {
    if (kf.time <= time) prev = kf
    if (kf.time >= time) {
      next = kf
      break
    }
  }

  if (prev.time === time) return prev.value
  if (next.time === time) return next.value

  // Linear interpolation
  const t = (time - prev.time) / (next.time - prev.time)
  if (typeof prev.value === 'number' && typeof next.value === 'number') {
    return prev.value + (next.value - prev.value) * t
  }

  return prev.value
}

/**
 * Create a simple rectangle shape for Lottie
 */
function createRectShape(width: number, height: number, fill: string): LottieShape[] {
  const color = parseColor(fill)

  return [
    {
      ty: 'rc', // Rectangle
      d: 1,
      s: { a: 0, k: [width, height] },
      p: { a: 0, k: [0, 0] },
      r: { a: 0, k: 0 },
    },
    {
      ty: 'fl', // Fill
      c: { a: 0, k: [...color, 1] },
      o: { a: 0, k: 100 },
      r: 1,
    },
  ]
}

/**
 * Export a timeline to Lottie JSON format.
 */
export function exportToLottie(timeline: Timeline, options: LottieExportOptions = {}): LottieAnimation {
  const {
    name = timeline.name || 'Animation',
    frameRate = 60,
    width = 512,
    height = 512,
  } = options

  const duration = timeline.duration
  const endFrame = msToFrame(duration, frameRate)

  const trackGroups = groupTracksByTarget(timeline.tracks)
  const layers: LottieLayer[] = []

  let layerIndex = 1
  for (const [target, tracks] of trackGroups) {
    const transform = createLottieTransform(tracks, frameRate)

    // Check for fill color in tracks
    const fillTrack = tracks.find(t => t.property === 'fill')
    const fillColor = fillTrack?.keyframes[0]?.value as string | undefined

    const layer: LottieLayer = {
      ddd: 0,
      ind: layerIndex++,
      ty: 4, // Shape layer
      nm: target,
      sr: 1,
      ks: transform,
      ao: 0,
      shapes: createRectShape(100, 100, fillColor ?? '#4a9eff'),
      ip: 0,
      op: endFrame,
      st: 0,
      bm: 0,
    }

    layers.push(layer)
  }

  return {
    v: '5.7.4',
    nm: name,
    fr: frameRate,
    ip: 0,
    op: endFrame,
    w: width,
    h: height,
    ddd: 0,
    assets: [],
    layers,
  }
}

/**
 * Export timeline to Lottie JSON string
 */
export function exportToLottieJSON(timeline: Timeline, options: LottieExportOptions = {}): string {
  return JSON.stringify(exportToLottie(timeline, options))
}
