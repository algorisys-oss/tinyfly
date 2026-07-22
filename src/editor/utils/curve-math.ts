import type { Track, Keyframe, EasingType, CubicBezierPoints } from '../../engine'
import { getEasingFunction, isCubicBezierEasing } from '../../engine'

/**
 * Pure helpers behind the curve (graph) editor. Kept framework-free and
 * pixel-free so they can be unit-tested and reused: the view maps the
 * (time, value) points these return into SVG pixels.
 */

/** A sampled point on a value-over-time curve. */
export interface CurvePoint {
  time: number
  value: number
}

/**
 * Cubic-bezier control-point approximations of the built-in easings, so the
 * curve editor can show draggable handles for a named easing (and convert it to
 * a real cubic-bezier the moment you drag one). Values are the widely-used
 * easings.net / CSS approximations. `[cp1x, cp1y, cp2x, cp2y]`.
 */
const BUILTIN_BEZIER: Record<string, CubicBezierPoints> = {
  linear: [0, 0, 1, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'ease-in-quad': [0.55, 0.085, 0.68, 0.53],
  'ease-out-quad': [0.25, 0.46, 0.45, 0.94],
  'ease-in-out-quad': [0.455, 0.03, 0.515, 0.955],
  'ease-in-cubic': [0.55, 0.055, 0.675, 0.19],
  'ease-out-cubic': [0.215, 0.61, 0.355, 1],
  'ease-in-out-cubic': [0.645, 0.045, 0.355, 1],
}

/**
 * Control points to draw a segment's easing handles with. A cubic-bezier easing
 * returns its own points; a named easing returns its approximation; anything
 * unknown (or undefined = linear) returns a straight line.
 */
export function easingToBezierPoints(easing: EasingType | undefined): CubicBezierPoints {
  if (isCubicBezierEasing(easing)) return easing.points
  if (typeof easing === 'string' && BUILTIN_BEZIER[easing]) return BUILTIN_BEZIER[easing]
  return [0, 0, 1, 1]
}

/** True when every keyframe value is a plain number (graphable as a curve). */
export function isNumericTrack(track: Track): boolean {
  return (
    track.property !== 'motionPath' &&
    track.keyframes.length > 0 &&
    track.keyframes.every((kf) => typeof kf.value === 'number')
  )
}

/**
 * The value range of a numeric track's keyframes, padded so the curve doesn't
 * touch the top/bottom of its lane. A flat track (all equal) gets a ±1 band so
 * the line sits centered.
 */
export function paddedRange(
  keyframes: Keyframe[],
  padding = 0.15
): { vmin: number; vmax: number } {
  let min = Infinity
  let max = -Infinity
  for (const kf of keyframes) {
    const v = kf.value as number
    if (typeof v !== 'number' || Number.isNaN(v)) continue
    if (v < min) min = v
    if (v > max) max = v
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { vmin: 0, vmax: 1 }
  if (min === max) return { vmin: min - 1, vmax: max + 1 }
  const pad = (max - min) * padding
  return { vmin: min - pad, vmax: max + pad }
}

/**
 * Sample a track's value curve as (time, value) points, applying the real
 * easing of each segment. Includes a flat lead-in from `0` to the first
 * keyframe and a flat tail-out to `endTime`, mirroring how the engine holds a
 * value before the first / after the last keyframe.
 *
 * `keyframes` must be sorted by time. Returns `[]` for an empty track.
 */
export function sampleCurve(
  keyframes: Keyframe[],
  endTime: number,
  samples = 24
): CurvePoint[] {
  if (keyframes.length === 0) return []
  const pts: CurvePoint[] = []
  const first = keyframes[0]
  const firstV = first.value as number

  // Flat lead-in.
  pts.push({ time: 0, value: firstV })
  if (first.time > 0) pts.push({ time: first.time, value: firstV })

  // Eased segments.
  for (let i = 1; i < keyframes.length; i++) {
    const a = keyframes[i - 1]
    const b = keyframes[i]
    const av = a.value as number
    const bv = b.value as number
    const ease = getEasingFunction(b.easing)
    const dt = b.time - a.time
    for (let s = 1; s <= samples; s++) {
      const p = s / samples
      pts.push({ time: a.time + dt * p, value: av + (bv - av) * ease(p) })
    }
  }

  // Flat tail-out.
  const last = keyframes[keyframes.length - 1]
  const lastV = last.value as number
  if (endTime > last.time) pts.push({ time: endTime, value: lastV })

  return pts
}
