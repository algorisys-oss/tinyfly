import type { TimelineDefinition } from '../engine'

/** Available transition effects between scenes */
export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'

/** Transition configuration when entering a scene */
export interface SceneTransition {
  /** Transition effect type */
  type: TransitionType
  /** Duration of the transition in milliseconds */
  duration: number
}

/** Default transition (no transition) */
export const DEFAULT_TRANSITION: SceneTransition = { type: 'none', duration: 0 }

/** Minimal element representation for the sequencer/embed player */
export interface SerializedElement {
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  /** Pre-rendered HTML for this element (complete tag with attributes) */
  html: string
}

/** A scene within a sequence (player-facing format) */
export interface SequenceScene {
  id: string
  name: string
  elements: SerializedElement[]
  timeline: TimelineDefinition | null
  /** Transition when entering this scene (ignored for first scene) */
  transition: SceneTransition
}

/** Serializable sequence definition for the multi-scene player */
export interface SequenceDefinition {
  id: string
  name: string
  canvas: { width: number; height: number }
  scenes: SequenceScene[]
  /** Loop count: -1 for infinite, 0 for no loop, n for n times */
  loop?: number
}

/** Options for the TinyflySequencer */
export interface SequencerOptions {
  /** Loop count override (-1 for infinite, 0 for no loop) */
  loop?: number
  /** Auto-play on load (default: false) */
  autoplay?: boolean
  /** Callback when entire sequence completes */
  onComplete?: () => void
  /** Callback when a scene starts playing */
  onSceneChange?: (sceneIndex: number) => void
}
