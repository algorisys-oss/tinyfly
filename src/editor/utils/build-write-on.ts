import { getPathLength } from '../../engine/path'
import type { SceneElement, PathElement } from '../stores/scene-store'
import type { TrackInput } from './build-typewriter'

/** Element types the Write On preset can draw on. */
const WRITE_ON_TYPES = new Set(['path', 'rect', 'circle', 'line'])

/** Whether Write On can draw this element's outline on. */
export function canWriteOn(element: SceneElement | null | undefined): boolean {
  return !!element && WRITE_ON_TYPES.has(element.type)
}

/**
 * Tracks that draw an element's outline on over `durationMs`.
 *
 * Every shape gets a `drawOn` track (0 → 1), which the Canvas renderer and
 * raster export draw. A path also gets stroke-dasharray / stroke-dashoffset
 * tracks, so the DOM and SVG renderers draw it on the same way.
 */
export function buildWriteOn(element: SceneElement, durationMs: number): TrackInput[] {
  if (!canWriteOn(element)) return []
  const tracks: TrackInput[] = [
    {
      target: element.name,
      property: 'drawOn',
      keyframes: [
        { time: 0, value: 0 },
        { time: durationMs, value: 1, easing: 'ease-out' },
      ],
    },
  ]
  if (element.type === 'path') {
    // stroke-dasharray = full length; stroke-dashoffset animates length -> 0.
    const length = Math.max(1, Math.round(getPathLength((element as PathElement).d)))
    tracks.push(
      { target: element.name, property: 'strokeDasharray', keyframes: [{ time: 0, value: length }] },
      {
        target: element.name,
        property: 'strokeDashoffset',
        keyframes: [
          { time: 0, value: length },
          { time: durationMs, value: 0, easing: 'ease-out' },
        ],
      }
    )
  }
  return tracks
}
