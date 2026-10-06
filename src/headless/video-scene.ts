import type { AnimationState, TimelineDefinition } from '../engine/types'
import type { CaptionCue } from '../engine/export/captions'
import type { BloomOptions, CanvasTarget } from '../adapters/canvas'

/**
 * A video scene: everything needed to render an animation to frames without a
 * browser.
 *
 * Two ways to draw, usable together:
 * - **Declarative**: `timeline` animates `targets` (canvas targets, including
 *   `custom` ones whose draw function is code).
 * - **Immediate**: `draw(ctx, frame)` paints the whole frame from the time,
 *   like a Cairo or Processing sketch. It runs after the targets; a
 *   `background` function runs before them.
 *
 * A scene is usually the default export of a module handed to `tinyfly video`.
 */
export interface VideoScene {
  /** Frame size in pixels, before `scale` */
  width: number
  height: number
  /** Frames per second (default 30) */
  fps?: number
  /**
   * Drawings per second for the timeline's animation: 12 holds every pose for
   * two frames of 24 fps ("on twos"), 8 for three ("on threes"), as hand-drawn
   * animation is timed. The frame rate (and `draw`, `background`) stays as set,
   * so camera moves drawn there can stay smooth. Default: every frame.
   */
  drawingRate?: number
  /** Length in ms (default: the timeline's duration) */
  duration?: number
  /** Animation data; its markers drive stills and captions */
  timeline?: TimelineDefinition
  /** Canvas targets by id, drawn in insertion order; tracks address them by id */
  targets?: Record<string, CanvasTarget>
  /**
   * What goes under the targets: a colour (default white; `transparent` paints
   * nothing) or a function that draws the backdrop each frame.
   */
  background?: string | DrawFunction
  /** Immediate-mode drawing, called every frame after the targets */
  draw?: DrawFunction
  /**
   * Glow around what is bright, added over each finished frame: `true` for
   * the defaults, or options (threshold, strength, radius in scene px…).
   * See `applyBloom`.
   */
  bloom?: boolean | BloomOptions
  /** Soundtrack to mux into the video, relative to the scene file */
  audio?: string
  /** Font files to register before drawing, by family, relative to the scene file */
  fonts?: Record<string, string>
  /** Captions to write alongside the video (default: from the timeline's markers) */
  captions?: CaptionCue[]
}

/** Draws part of a frame. Context state is saved and restored around each call. */
export type DrawFunction = (ctx: CanvasRenderingContext2D, frame: FrameInfo) => void

/** What the draw function knows about the frame being drawn. */
export interface FrameInfo {
  /** 0-based frame number (0 for stills) */
  index: number
  /** Time in ms */
  time: number
  /** Timeline state at `time`, when the scene has a timeline */
  state?: AnimationState
  /** Timeline state at any other time (trails ask where things were), when the scene has a timeline */
  stateAt?: (time: number) => AnimationState
  /** Scene size in pixels (the logical size, before `scale`) */
  width: number
  height: number
}

export const DEFAULT_FPS = 30
