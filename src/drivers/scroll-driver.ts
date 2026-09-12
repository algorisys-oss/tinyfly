import type { Timeline } from '../engine'
import type { Driver } from './types'
import { scrollProgress, smoothToward, type TriggerPosition, type Rect } from './scroll-math'

/**
 * Ties a timeline's playhead to scroll position ("scrubbing").
 *
 * All the geometry lives in `scroll-math.ts`; this class is the DOM shell that
 * reads rectangles, listens for scroll, and seeks the timeline. The engine is
 * untouched — from its point of view this is just a caller of `seek()`.
 *
 * Pinning is deliberately not implemented: it requires mutating page layout,
 * which is where most of ScrollTrigger's complexity lives. `position: sticky`
 * on the trigger's container covers the common cases — see docs/scroll-animation.md.
 */

export interface ScrollDriverOptions {
  /** The timeline to scrub */
  timeline: Timeline
  /** Element whose position drives the playhead */
  trigger: Element
  /**
   * Where scrubbing begins, as `"<element edge> <viewport edge>"`
   * (default: `'top bottom'` — when the element's top reaches the viewport's bottom).
   */
  start?: TriggerPosition
  /** Where scrubbing ends (default: `'bottom top'`) */
  end?: TriggerPosition
  /**
   * `true` maps scroll position to time exactly (snappy, frame-accurate).
   * A number smooths the playhead toward its target over that many seconds,
   * which feels nicer but makes the displayed time frame-rate dependent.
   */
  scrub?: boolean | number
  /** Scroll container (default: the window) */
  scroller?: HTMLElement | null
  /** Called with 0..1 whenever progress changes */
  onUpdate?: (progress: number) => void
  /** Scrolled into the active range, going down */
  onEnter?: () => void
  /** Scrolled out of the active range, going down */
  onLeave?: () => void
  /** Scrolled back into the active range, going up */
  onEnterBack?: () => void
  /** Scrolled back out of the active range, going up */
  onLeaveBack?: () => void
}

export class ScrollDriver implements Driver {
  private timeline: Timeline
  private options: ScrollDriverOptions
  private running = false

  /** Progress the page is actually at */
  private targetProgress = 0
  /** Progress the playhead is showing (differs from target only while smoothing) */
  private displayProgress = 0
  /** Whether we were inside [start, end] on the previous sample */
  private wasActive = false

  private rafId: number | null = null
  private lastFrameTime: number | null = null
  private readonly onScroll = () => this.sample()

  constructor(options: ScrollDriverOptions) {
    this.timeline = options.timeline
    this.options = options
  }

  start(): void {
    if (this.running) return
    this.running = true

    // The timeline is driven entirely by scroll, so it must not also advance on
    // its own clock.
    this.timeline.pause()

    const scroller: EventTarget | null = this.options.scroller ?? (typeof window !== 'undefined' ? window : null)
    scroller?.addEventListener('scroll', this.onScroll, { passive: true })
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onScroll, { passive: true })
    }

    this.sample()
    if (this.smoothing() > 0) this.startSmoothing()
  }

  stop(): void {
    if (!this.running) return
    this.running = false

    const scroller: EventTarget | null = this.options.scroller ?? (typeof window !== 'undefined' ? window : null)
    scroller?.removeEventListener('scroll', this.onScroll)
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onScroll)
    }

    this.stopSmoothing()
  }

  destroy(): void {
    this.stop()
  }

  /** Current scroll progress, 0..1. */
  get progress(): number {
    return this.targetProgress
  }

  /**
   * Read the page and update progress. Exposed so a host can force a sample
   * after it changes layout itself.
   */
  sample(): void {
    const rect = this.triggerRect()
    if (!rect) return

    const viewportHeight = this.viewportHeight()
    const previous = this.targetProgress

    this.targetProgress = scrollProgress(
      rect,
      viewportHeight,
      this.options.start ?? 'top bottom',
      this.options.end ?? 'bottom top'
    )

    this.fireBoundaryCallbacks(previous, this.targetProgress)

    // Without smoothing the playhead follows the page exactly, so apply now.
    if (this.smoothing() <= 0) {
      this.displayProgress = this.targetProgress
      this.applyProgress()
    }
  }

  /** Seconds of smoothing, or 0 for exact tracking. */
  private smoothing(): number {
    const scrub = this.options.scrub
    return typeof scrub === 'number' ? Math.max(0, scrub) : 0
  }

  private applyProgress(): void {
    const duration = this.timeline.duration
    if (duration > 0) {
      this.timeline.seek(this.displayProgress * duration)
    }
    this.options.onUpdate?.(this.displayProgress)
  }

  /**
   * Emit enter/leave callbacks on the edges of the active range.
   *
   * "Active" is 0 < progress < 1; crossing into it from below is an enter, from
   * above an enterBack, and the reverse for leaves.
   */
  private fireBoundaryCallbacks(previous: number, current: number): void {
    const isActive = current > 0 && current < 1

    if (isActive && !this.wasActive) {
      if (current >= previous) this.options.onEnter?.()
      else this.options.onEnterBack?.()
    } else if (!isActive && this.wasActive) {
      if (current >= previous) this.options.onLeave?.()
      else this.options.onLeaveBack?.()
    }

    this.wasActive = isActive
  }

  private startSmoothing(): void {
    if (typeof requestAnimationFrame === 'undefined') return

    const frame = (timestamp: number) => {
      if (!this.running) return

      const delta = this.lastFrameTime === null ? 16.67 : timestamp - this.lastFrameTime
      this.lastFrameTime = timestamp

      this.displayProgress = smoothToward(
        this.displayProgress,
        this.targetProgress,
        this.smoothing(),
        delta
      )
      this.applyProgress()

      this.rafId = requestAnimationFrame(frame)
    }

    this.rafId = requestAnimationFrame(frame)
  }

  private stopSmoothing(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
    }
    this.rafId = null
    this.lastFrameTime = null
  }

  private triggerRect(): Rect | null {
    const el = this.options.trigger as Element & { getBoundingClientRect?: () => DOMRect }
    if (typeof el?.getBoundingClientRect !== 'function') return null

    const box = el.getBoundingClientRect()

    // Measure against the scroll container when one is given, so a nested
    // scroller behaves like the viewport does.
    const scroller = this.options.scroller
    if (scroller && typeof scroller.getBoundingClientRect === 'function') {
      const host = scroller.getBoundingClientRect()
      return { top: box.top - host.top, bottom: box.bottom - host.top, height: box.height }
    }

    return { top: box.top, bottom: box.bottom, height: box.height }
  }

  private viewportHeight(): number {
    const scroller = this.options.scroller
    if (scroller) return scroller.clientHeight
    return typeof window !== 'undefined' ? window.innerHeight : 0
  }
}

/** Convenience wrapper: create a started ScrollDriver. */
export function scrubOnScroll(options: ScrollDriverOptions): ScrollDriver {
  const driver = new ScrollDriver(options)
  driver.start()
  return driver
}
