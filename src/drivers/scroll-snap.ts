import { easeInOutCubic, type EasingFunction } from '../engine'

/**
 * Snapping: once scrolling stops inside a trigger's range, scroll on to the
 * nearest snap point — a section boundary, a label, a step.
 *
 * The choice is pure maths (`snapProgress`). The scrolling is the one place a
 * driver writes to the page, so it is kept small and polite: it animates the
 * scroll offset for a short time and stops the moment the person scrolls,
 * touches, clicks or presses a key.
 */

/** Where to snap: a step (`0.25`), the points themselves, or a function choosing one. */
export type SnapTo = number | number[] | ((progress: number) => number)

export interface SnapConfig {
  snapTo: SnapTo
  /** Seconds, or a range scaled by distance (default `{ min: 0.2, max: 0.8 }`) */
  duration?: number | { min: number; max: number }
  /** Seconds to wait after scrolling stops (default 0) */
  delay?: number
  /** Default ease-in-out */
  ease?: EasingFunction
}

export type SnapOption = SnapTo | SnapConfig

/** How far ahead to look, in seconds of the release velocity, when choosing a point. */
const MOMENTUM_SECONDS = 0.15

export function snapConfig(option: SnapOption): SnapConfig {
  return typeof option === 'object' && !Array.isArray(option) ? option : { snapTo: option }
}

/**
 * The progress to settle at, from where scrolling stopped. `velocity` is progress
 * per second as scrolling slowed down: a flick carries on toward the next point
 * rather than falling back to the one it left.
 */
export function snapProgress(progress: number, velocity: number, snapTo: SnapTo): number {
  const projected = clamp01(progress + velocity * MOMENTUM_SECONDS)
  if (typeof snapTo === 'function') return clamp01(snapTo(projected))
  if (typeof snapTo === 'number') {
    if (snapTo <= 0) return progress
    return clamp01(Math.round(projected / snapTo) * snapTo)
  }
  if (snapTo.length === 0) return progress
  let nearest = snapTo[0]
  for (const point of snapTo) {
    if (Math.abs(point - projected) < Math.abs(nearest - projected)) nearest = point
  }
  return clamp01(nearest)
}

/** Seconds to spend covering `distancePx`: longer for longer distances, within the range. */
export function snapDuration(config: SnapConfig, distancePx: number, viewportPx: number): number {
  const duration = config.duration ?? { min: 0.2, max: 0.8 }
  if (typeof duration === 'number') return duration
  const t = Math.min(1, Math.abs(distancePx) / Math.max(1, viewportPx))
  return duration.min + (duration.max - duration.min) * t
}

/** Animates a scroll offset, and gives way to the person scrolling. */
export class ScrollAnimator {
  private rafId: number | null = null
  private readonly cancelEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown']
  private readonly onInterrupt = () => this.cancel()
  private readonly write: (offset: number) => void
  private readonly eventTarget: EventTarget | null

  constructor(write: (offset: number) => void, eventTarget: EventTarget | null) {
    this.write = write
    this.eventTarget = eventTarget
  }

  get active(): boolean {
    return this.rafId !== null
  }

  animate(from: number, to: number, seconds: number, ease: EasingFunction = easeInOutCubic, onDone?: () => void): void {
    this.cancel()
    if (typeof requestAnimationFrame === 'undefined' || seconds <= 0) {
      this.write(to)
      onDone?.()
      return
    }
    for (const type of this.cancelEvents) this.eventTarget?.addEventListener(type, this.onInterrupt, { passive: true })

    let startTime: number | null = null
    const frame = (now: number) => {
      startTime ??= now
      const t = Math.min(1, (now - startTime) / (seconds * 1000))
      this.write(from + (to - from) * ease(t))
      if (t < 1) {
        this.rafId = requestAnimationFrame(frame)
      } else {
        this.rafId = null
        this.detach()
        onDone?.()
      }
    }
    this.rafId = requestAnimationFrame(frame)
  }

  cancel(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.detach()
  }

  private detach(): void {
    for (const type of this.cancelEvents) this.eventTarget?.removeEventListener(type, this.onInterrupt)
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
