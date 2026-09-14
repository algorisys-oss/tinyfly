import type { AnyTrack, TimelineConfig, TimelineDefinition } from '../../engine/types'
import type { SceneElement } from '../stores/scene-store'

/**
 * An Animation Document: a scene's elements and its tracks in one file (see
 * docs/file-format.md). Unlike the timeline JSON, it says what to draw as well as
 * how to animate it, so another app can rebuild the animation from the file alone.
 */
export interface AnimationDocument {
  name?: string
  /** Total length in ms. */
  duration: number
  canvas?: { width: number; height: number; background?: string }
  /** Playback options other than duration (loop, speed, markers...), when set. */
  config?: Omit<TimelineConfig, 'duration'>
  captions?: Record<string, Record<string, string>>
  elements: SceneElement[]
  /** Tracks target element names, as in the editor. */
  tracks: AnyTrack[]
}

/**
 * Build an Animation Document from the current scene. `duration` is the timeline's
 * length, used when the definition does not declare one. Everything is copied, so
 * editing the scene afterwards leaves the document unchanged.
 */
export function toAnimationDocument(
  timeline: TimelineDefinition,
  duration: number,
  elements: readonly SceneElement[],
  canvas?: { width: number; height: number; background?: string },
): AnimationDocument {
  const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v))
  const { duration: declared, ...rest } = timeline.config ?? {}
  const doc: AnimationDocument = {
    name: timeline.name ?? timeline.id,
    duration: typeof declared === 'number' && declared > 0 ? declared : duration,
    elements: copy([...elements]),
    tracks: copy(timeline.tracks),
  }
  if (canvas) doc.canvas = { ...canvas }
  if (Object.keys(rest).length > 0) doc.config = copy(rest)
  if (timeline.captions) doc.captions = copy(timeline.captions)
  return doc
}
