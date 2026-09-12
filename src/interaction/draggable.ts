import type { Timeline } from '../engine'
import { Observer, type ObserverState } from './observer'
import { snapAxis, gridLinesFor } from './snap'

/**
 * Drag a target, or drag to scrub a timeline.
 *
 * Two output modes, and the difference matters:
 *
 *  - `mode: 'scrub'` maps horizontal or vertical drag distance onto a
 *    timeline's playhead. Nothing new is stored; the timeline is still the
 *    source of truth, so this composes with everything else.
 *  - `mode: 'move'` reports positions for the caller to apply to a target.
 *    This is live interaction with **no serializable representation** — a
 *    dragged position is not part of the animation document. Use it for
 *    editors and toys, not for something you intend to export.
 */

export type DragAxis = 'x' | 'y' | 'both'
export type DragMode = 'move' | 'scrub'

export interface DragBounds {
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
}

export interface DraggableOptions {
  /** Element that receives the drag gestures */
  target: EventTarget
  /** Which axes can move (default: 'both') */
  axis?: DragAxis
  /** What dragging does (default: 'move') */
  mode?: DragMode
  /** Clamp the dragged position */
  bounds?: DragBounds
  /** Snap the dragged position to a grid of this size, in pixels */
  snap?: number
  /**
   * Extra positions to snap to, in pixels — e.g. other elements' edges or
   * guides. Combined with the grid; the nearest match within `snapThreshold`
   * wins.
   */
  snapLinesX?: number[]
  snapLinesY?: number[]
  /**
   * How close a snap line must be to catch, in pixels.
   *
   * Defaults to half the grid size when `snap` is set, so every position is
   * within reach of a grid line and grid snapping behaves like plain rounding.
   * With no grid it defaults to 8px, which is the right feel for snapping to
   * another element's edge.
   */
  snapThreshold?: number
  /** Starting position */
  initialX?: number
  initialY?: number

  /** mode: 'scrub' — the timeline to scrub */
  timeline?: Timeline
  /**
   * mode: 'scrub' — pixels of drag that cover the whole timeline
   * (default: 500). Negative reverses the direction.
   */
  scrubDistance?: number

  /** Called with the new position on every move */
  onDrag?: (position: { x: number; y: number }, state: ObserverState) => void
  /**
   * Called with the lines that caught on this move (null where nothing did),
   * so a host can draw snap guides.
   */
  onSnap?: (lines: { x: number | null; y: number | null }) => void
  onPress?: (state: ObserverState) => void
  onRelease?: (state: ObserverState) => void
}

export class Draggable {
  private options: DraggableOptions
  private observer: Observer
  private x: number
  private y: number
  /** Position when the current gesture began */
  private originX = 0
  private originY = 0
  /** Lines that caught on the last constraint pass, for guide drawing */
  private snappedX: number | null = null
  private snappedY: number | null = null

  constructor(options: DraggableOptions) {
    this.options = options
    this.x = options.initialX ?? 0
    this.y = options.initialY ?? 0

    this.observer = new Observer({
      target: options.target,
      onPress: (state) => {
        this.originX = this.x
        this.originY = this.y
        options.onPress?.(state)
      },
      onMove: (state) => this.handleMove(state),
      onRelease: (state) => options.onRelease?.(state),
    })
  }

  start(): void {
    this.observer.start()
  }

  stop(): void {
    this.observer.stop()
  }

  destroy(): void {
    this.observer.destroy()
  }

  /** Current dragged position. */
  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /** Velocity at the last movement, in pixels per second. */
  get velocity(): { x: number; y: number } {
    return this.observer.velocity
  }

  /** Move the target programmatically, applying bounds and snapping. */
  setPosition(x: number, y: number): void {
    const axis = this.options.axis ?? 'both'
    this.x = axis === 'y' ? this.x : this.applyConstraints(x, 'x')
    this.y = axis === 'x' ? this.y : this.applyConstraints(y, 'y')
  }

  /** The snap lines that caught on the last move, for drawing guides. */
  get snapLines(): { x: number | null; y: number | null } {
    return { x: this.snappedX, y: this.snappedY }
  }

  /** See `snapThreshold` in the options. */
  private snapThreshold(): number {
    if (this.options.snapThreshold !== undefined) return this.options.snapThreshold
    const grid = this.options.snap ?? 0
    return grid > 0 ? grid / 2 : 8
  }

  private handleMove(state: ObserverState): void {
    this.setPosition(this.originX + state.totalX, this.originY + state.totalY)

    if (this.options.mode === 'scrub') {
      this.scrub()
    }

    this.options.onDrag?.(this.position, state)
    this.options.onSnap?.(this.snapLines)
  }

  /** Map the dragged distance onto the timeline's playhead. */
  private scrub(): void {
    const timeline = this.options.timeline
    if (!timeline) return

    const duration = timeline.duration
    if (duration <= 0) return

    const distance = this.options.scrubDistance ?? 500
    if (distance === 0) return

    const travelled = (this.options.axis ?? 'both') === 'y' ? this.y : this.x
    const progress = clamp01(travelled / distance)

    timeline.pause()
    timeline.seek(progress * duration)
  }

  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  private applyConstraints(value: number, axis: 'x' | 'y'): number {
    let out = value

    const staticLines = [
      ...gridLinesFor([out], this.options.snap ?? 0),
      ...((axis === 'x' ? this.options.snapLinesX : this.options.snapLinesY) ?? []),
    ]

    const snapped = snapAxis([out], staticLines, this.snapThreshold())
    out += snapped.delta
    if (axis === 'x') this.snappedX = snapped.line
    else this.snappedY = snapped.line

    const bounds = this.options.bounds
    if (bounds) {
      const min = axis === 'x' ? bounds.minX : bounds.minY
      const max = axis === 'x' ? bounds.maxX : bounds.maxY
      if (min !== undefined) out = Math.max(min, out)
      if (max !== undefined) out = Math.min(max, out)
    }

    return out
  }
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** Convenience wrapper: create a started Draggable. */
export function draggable(options: DraggableOptions): Draggable {
  const d = new Draggable(options)
  d.start()
  return d
}
