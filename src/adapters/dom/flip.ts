import type { Track, EasingType } from '../../engine'
import { createTrack } from '../../engine'

/**
 * FLIP layout transitions, compiled to ordinary keyframes.
 *
 * GSAP's Flip measures the page, applies your layout change, measures again,
 * and animates the difference — re-measuring on every run. The engine cannot do
 * that: reading live layout is exactly the implicit browser state that
 * determinism rule 5 forbids.
 *
 * So measurement happens *here*, in the DOM layer, at authoring time. The
 * output is a set of plain two-keyframe tracks that serialize and replay like
 * anything else. The trade-off, and it is a real one: the resulting JSON is a
 * snapshot of one specific layout change. Re-run it after the page reflows —
 * a different viewport, different text — and it will animate the old geometry.
 * Recompute it when that matters.
 */

export interface FlipTarget {
  /** Name the engine knows this element by */
  name: string
  /** The element to measure */
  element: Element
}

export interface FlipOptions {
  /** Duration of the generated tracks, in milliseconds (default: 600) */
  duration?: number
  /** Easing applied to the end keyframe (default: 'ease-out') */
  easing?: EasingType
  /** Animate size as well as position (default: true) */
  scale?: boolean
  /** Prefix for generated track ids (default: 'flip') */
  idPrefix?: string
}

interface Measurement {
  left: number
  top: number
  width: number
  height: number
}

/** Snapshot of a set of elements' geometry, taken before a layout change. */
export interface FlipState {
  measurements: Map<string, Measurement>
}

/**
 * Measure a set of elements. Call this *before* the layout change.
 */
export function recordFlipState(targets: FlipTarget[]): FlipState {
  const measurements = new Map<string, Measurement>()

  for (const { name, element } of targets) {
    measurements.set(name, measure(element))
  }

  return { measurements }
}

/**
 * Measure again and emit tracks animating from the recorded geometry to the
 * current geometry. Call this *after* the layout change.
 *
 * Elements whose geometry did not change produce no tracks, so a Flip over a
 * long list only animates what actually moved.
 */
export function buildFlipTracks(
  before: FlipState,
  targets: FlipTarget[],
  options: FlipOptions = {}
): Track[] {
  const duration = options.duration ?? 600
  const easing = options.easing ?? 'ease-out'
  const withScale = options.scale !== false
  const prefix = options.idPrefix ?? 'flip'

  const tracks: Track[] = []

  for (const { name, element } of targets) {
    const from = before.measurements.get(name)
    if (!from) continue

    const to = measure(element)

    // The element is already in its final position; we animate it *back* to
    // where it was and let it return. That is the "Invert" in FLIP.
    const deltaX = from.left - to.left
    const deltaY = from.top - to.top

    if (deltaX !== 0 || deltaY !== 0) {
      tracks.push(
        makeTrack(`${prefix}-${name}-x`, name, 'x', deltaX, 0, duration, easing),
        makeTrack(`${prefix}-${name}-y`, name, 'y', deltaY, 0, duration, easing)
      )
    }

    if (withScale && to.width > 0 && to.height > 0) {
      const scaleX = from.width / to.width
      const scaleY = from.height / to.height

      if (scaleX !== 1) {
        tracks.push(makeTrack(`${prefix}-${name}-sx`, name, 'scaleX', scaleX, 1, duration, easing))
      }
      if (scaleY !== 1) {
        tracks.push(makeTrack(`${prefix}-${name}-sy`, name, 'scaleY', scaleY, 1, duration, easing))
      }
    }
  }

  return tracks
}

/**
 * Measure, run a layout change, measure again, and return the tracks — the
 * one-call form of the two functions above.
 */
export function flip(
  targets: FlipTarget[],
  applyLayoutChange: () => void,
  options: FlipOptions = {}
): Track[] {
  const before = recordFlipState(targets)
  applyLayoutChange()
  return buildFlipTracks(before, targets, options)
}

function makeTrack(
  id: string,
  target: string,
  property: string,
  from: number,
  to: number,
  duration: number,
  easing: EasingType
): Track {
  return createTrack({
    id,
    target,
    property,
    keyframes: [
      { time: 0, value: from },
      { time: duration, value: to, easing },
    ],
  })
}

function measure(element: Element): Measurement {
  const el = element as Element & { getBoundingClientRect?: () => DOMRect }
  if (typeof el.getBoundingClientRect !== 'function') {
    return { left: 0, top: 0, width: 0, height: 0 }
  }

  const rect = el.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}
