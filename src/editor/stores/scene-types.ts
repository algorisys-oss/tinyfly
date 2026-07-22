import type { TimelineDefinition } from '../../engine'
import type { SceneElement } from './scene-store'
import type { SceneTransition } from '../../player/sequence-types'

/**
 * A scene bundles elements and a timeline together.
 * Each project contains one or more scenes.
 */
export interface SceneDefinition {
  /** Unique identifier for this scene */
  id: string
  /** Human-readable name */
  name: string
  /** Sort order within the project */
  order: number
  /** Scene elements (shapes, text, images, etc.) */
  elements: SceneElement[]
  /** Animation timeline for this scene */
  timeline: TimelineDefinition | null
  /** Transition effect when entering this scene (from previous scene) */
  transition?: SceneTransition
}

/**
 * A reusable, self-contained bundle of elements (with its own optional nested
 * timeline). Stored on the project (the "Library") and referenced by
 * `SymbolInstanceElement`s placed in scenes — define once, instance many times,
 * edit-once-update-everywhere. Fully JSON-serializable, like a mini-scene.
 */
export interface SymbolDefinition {
  /** Unique identifier */
  id: string
  /** Human-readable name (shown in the Library) */
  name: string
  /** Intrinsic size; instances scale from this into their placement box. */
  width: number
  height: number
  /** The symbol's own contents */
  elements: SceneElement[]
  /** The symbol's own (nested) animation, if any */
  timeline: TimelineDefinition | null
  created: number
  modified: number
}
