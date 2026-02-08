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
